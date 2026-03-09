"""
Website Fetcher - 网站数据获取工具

功能说明：
- 批量获取网站的标题、描述、图标等信息
- 支持多线程并发请求，提高效率
- 自动检测并转换图片格式为 Base64 Data URI
- 为无法获取图标的网站生成 SVG 占位图标
- 支持增量获取和断点续传

使用示例：
    fetcher = WebsiteFetcher(max_workers=5, timeout=10)
    websites = fetcher.batch_fetch(['https://example.com'])
    fetcher.save_to_json(websites, 'websites.json')
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
import json
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from datetime import datetime

# 尝试导入 favicon 库（可选依赖）
try:
    from favicon import get_favicon
    FAVICON_AVAILABLE = True
except ImportError:
    FAVICON_AVAILABLE = False


class WebsiteFetcher:
    """网站数据获取器
    
    主要功能：
    1. 获取网站标题、描述等元数据
    2. 抓取网站 favicon 图标并转换为 Base64
    3. 生成 SVG 占位图标作为降级方案
    4. 支持批量并发获取
    
    属性：
        max_workers (int): 最大并发线程数
        timeout (int): 请求超时时间（秒）
        session (requests.Session): 配置好的 requests 会话对象
    """
    
    def __init__(self, max_workers=5, timeout=10):
        """初始化工具类
        
        Args:
            max_workers (int, optional): 最大并发数，默认 5 个线程
            timeout (int, optional): 请求超时时间，默认 10 秒
            
        Example:
            >>> fetcher = WebsiteFetcher(max_workers=10, timeout=15)
            >>> # 创建一个最多 10 个线程，请求超时 15 秒的获取器
        """
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = self._create_session()
    
    def _create_session(self):
        """创建带有重试机制的 HTTP Session
        
        配置内容：
        - User-Agent 模拟真实浏览器
        - 自动重试策略（针对 429/500/502/503/504 错误）
        - 指数退避（backoff_factor=1）
        
        Returns:
            requests.Session: 配置完成的会话对象，可用于发送 HTTP 请求
        """
        session = requests.Session()
        
        # 配置重试策略
        retry_strategy = requests.adapters.Retry(
            total=3,  # 总重试次数
            backoff_factor=1,  # 退避因子：重试间隔 = backoff_factor * (2 ** (重试次数 - 1))
            status_forcelist=[429, 500, 502, 503, 504],  # 强制重试的状态码
        )
        
        # 应用重试策略到 HTTP/HTTPS 适配器
        adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # 设置请求头，模拟真实浏览器
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        })
        
        return session
    
    def normalize_url(self, url):
        """标准化 URL 格式
        
        处理逻辑：
        1. 去除首尾空白
        2. 自动补全协议（缺少时添加 https://）
        3. 域名转小写
        4. 统一使用 https 协议
        
        Args:
            url (str): 原始 URL，例如 "www.example.com" 或 "http://EXAMPLE.COM/path"
            
        Returns:
            str: 标准化后的 URL，例如 "https://example.com/path"
            
        Example:
            >>> fetcher.normalize_url("www.baidu.com")
            'https://www.baidu.com'
            >>> fetcher.normalize_url("  HTTP://EXAMPLE.COM  ")
            'https://example.com'
        """
        url = url.strip()
        
        # 自动补全协议
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'https://' + url
        
        parsed = urlparse(url)
        scheme = 'https'  # 强制使用 HTTPS
        
        # 重建标准化的 URL
        normalized = urlunparse((
            scheme,
            parsed.netloc.lower(),  # 域名转小写
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment
        ))
        
        return normalized
    
    def extract_domain(self, url):
        """提取域名（包含端口）
        
        Args:
            url (str): 完整 URL，例如 "https://www.example.com:8080/path"
            
        Returns:
            str: 域名部分，例如 "www.example.com:8080"
            
        Example:
            >>> fetcher.extract_domain("https://www.baidu.com/s?wd=test")
            'www.baidu.com'
        """
        parsed = urlparse(url)
        return parsed.netloc
    
    def fetch_title(self, soup):
        """从 HTML 中提取网站标题
        
        过滤规则：
        - 去除无意义的跳转页面标题（如"Sina Visitor System"）
        - 确保 UTF-8 编码
        
        Args:
            soup (BeautifulSoup): 解析后的 HTML 对象
            
        Returns:
            str: 网站标题，如果未找到则返回空字符串
            
        Example:
            >>> response = requests.get("https://www.baidu.com")
            >>> soup = BeautifulSoup(response.text, 'html.parser')
            >>> fetcher.fetch_title(soup)
            '百度一下，你就知道'
        """
        # 先查找 head 标签，然后在 head 中查找 title 标签
        # 这样可以避免获取到 body 中可能存在的错误 title 标签
        head_tag = soup.find('head')
        if head_tag:
            title_tag = head_tag.find('title')
        else:
            # 如果没有找到 head 标签，则在整个文档中查找 title
            title_tag = soup.find('title')
        
        if title_tag:
            title = title_tag.text.strip()
            # 确保字符串是有效的 UTF-8
            title = self._ensure_utf8(title)
            # 过滤掉一些无意义的标题（通常是访问控制系统或跳转页面的标题）
            if title and title not in ['Sina Visitor System', '正在跳转...', 'Redirecting...', 'Please Wait...']:
                return title
        return ''

    def fetch_description(self, soup):
        """从 HTML 中提取网站描述
        
        优先级顺序：
        1. Open Graph (og:description) - Facebook/Open Graph 协议
        2. Twitter Card (twitter:description) - Twitter 卡片协议
        3. 标准 meta description - HTML 标准描述标签
        4. Schema.org (itemprop="description") - Schema.org 结构化数据
        
        Args:
            soup (BeautifulSoup): 解析后的 HTML 对象
            
        Returns:
            str: 网站描述，如果未找到则返回空字符串
            
        Example:
            >>> response = requests.get("https://github.com")
            >>> soup = BeautifulSoup(response.text, 'html.parser')
            >>> fetcher.fetch_description(soup)
            'GitHub is where over 100 million developers shape the future of software...'
        """
        selectors = [
            ('meta[property="og:description"]', 'content'),
            ('meta[name="twitter:description"]', 'content'),
            ('meta[name="description"]', 'content'),
            ('meta[itemprop="description"]', 'content'),
        ]
        
        for selector, attr in selectors:
            meta = soup.select_one(selector)
            if meta and meta.get(attr):
                desc = meta[attr].strip()
                if desc:
                    # 确保字符串是有效的 UTF-8
                    return self._ensure_utf8(desc)
        
        return ''

    def _ensure_utf8(self, text):
        """确保文本是有效的 UTF-8 编码
        
        处理流程：
        1. 检查是否为字符串类型
        2. 编码为 bytes（忽略错误字符）
        3. 解码回 UTF-8 字符串
        
        为什么需要这个函数？
        - 网页可能使用不同的字符编码（GBK、ISO-8859-1 等）
        - 直接读取可能导致乱码
        - 通过重新编码和解码，确保输出纯 UTF-8 文本
        
        Args:
            text (str): 待处理的文本
            
        Returns:
            str: UTF-8 编码的文本，如果处理失败则返回原文本
        """
        if isinstance(text, str):
            # 尝试重新编码为 UTF-8 以处理潜在的编码问题
            try:
                # 先编码为 bytes，再解码为 UTF-8
                # errors='ignore' 表示遇到无法编码的字符时直接忽略
                encoded = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
                return encoded
            except:
                return text
        return text

    def detect_image_format(self, binary_data):
        """根据文件头（魔数）检测图像格式
        
        常见图片格式的文件头（十六进制）：
        - PNG: 89 50 4E 47 (\\x89PNG)
        - JPEG: FF D8 FF (\\xff\\xd8\\xff)
        - GIF: 47 49 46 38 (GIF87a/GIF89a)
        - ICO: 00 00 01 00
        - SVG: XML 声明或<svg 标签（纯文本）
        
        什么是文件头（魔数）？
        - 文件开头的几个字节用于标识文件格式
        - 比文件扩展名更可靠，因为扩展名可能被篡改
        
        Args:
            binary_data (bytes): 图片二进制数据
            
        Returns:
            str: 图片格式名称（png/jpeg/gif/x-icon/svg+xml 等），默认返回 png
            
        Example:
            >>> with open('icon.png', 'rb') as f:
            ...     data = f.read()
            >>> fetcher.detect_image_format(data)
            'png'
        """
        if len(binary_data) < 4:
            return 'png'  # 默认返回 png
        
        # 检查文件头（魔数）
        if binary_data.startswith(b'\\x89PNG'):
            return 'png'
        elif binary_data.startswith(b'\\xff\\xd8\\xff'):
            return 'jpeg'
        elif binary_data.startswith(b'GIF87a') or binary_data.startswith(b'GIF89a'):
            return 'gif'
        elif binary_data.startswith(b'\\x00\\x00\\x01\\x00') or binary_data.startswith(b'\\x00\\x00\\x02\\x00'):
            return 'x-icon'  # ICO 格式
        elif binary_data.startswith(b'<?xml') or b'<svg' in binary_data[:100]:
            return 'svg+xml'
        else:
            # 如果无法通过文件头检测，默认为 png
            return 'png'

    def get_mime_type_from_content_type(self, content_type):
        """从 HTTP 响应头 Content-Type 中提取 MIME 类型
        
        MIME 类型是什么？
        - 互联网媒体类型，用于标识文件或数据的格式
        - 格式：type/subtype，如 image/png、text/html
        
        Args:
            content_type (str): HTTP 响应头中的 Content-Type 值，例如 "image/png; charset=utf-8"
            
        Returns:
            str: 简化的格式名称（如 png/jpeg/x-icon），如果无法识别则返回 None
            
        Example:
            >>> fetcher.get_mime_type_from_content_type("image/png; charset=utf-8")
            'png'
            >>> fetcher.get_mime_type_from_content_type("image/vnd.microsoft.icon")
            'x-icon'
        """
        if not content_type:
            return None
        
        content_type = content_type.lower()
        
        # 常见的图标 MIME 类型映射
        format_map = {
            'image/x-icon': 'x-icon',
            'image/vnd.microsoft.icon': 'x-icon',
            'image/png': 'png',
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpeg',
            'image/svg+xml': 'svg+xml',
            'image/gif': 'gif',
            'image/webp': 'webp'
        }
        
        for mime_type, format_name in format_map.items():
            if mime_type in content_type:
                return format_name
        
        return None

    def build_data_uri(self, binary_data, content_type=None):
        """构建完整的 Data URI（Base64 编码的图片数据）
        
        Data URI 格式：data:image/png;base64,iVBORw0KGgoAAAANS...
        
        什么是 Data URI？
        - 一种将小文件直接嵌入网页的技术
        - 格式：data:[<MIME type>][;base64],<data>
        - 优点：减少 HTTP 请求，提高加载速度
        
        检测优先级：
        1. HTTP 响应头 Content-Type（最准确）
        2. 文件头魔数检测（次选）
        
        Args:
            binary_data (bytes): 图片二进制数据
            content_type (str, optional): HTTP 响应头中的 Content-Type
            
        Returns:
            str: 完整的 Data URI，可直接用作<img>标签的 src 属性
            
        Example:
            >>> with open('icon.png', 'rb') as f:
            ...     data = f.read()
            >>> uri = fetcher.build_data_uri(data, 'image/png')
            >>> print(uri[:50])
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        """
        # 首先尝试从 Content-Type 获取格式
        icon_format = self.get_mime_type_from_content_type(content_type)
        
        # 如果 Content-Type 无效，使用文件头检测
        if not icon_format:
            icon_format = self.detect_image_format(binary_data)
        
        # 构建 Data URI
        # base64.b64encode() 返回 bytes 对象，需要 decode() 转为字符串
        icon_data = base64.b64encode(binary_data).decode('utf-8')
        return f'data:image/{icon_format};base64,{icon_data}'

    def fetch_favicon(self, url, soup):
        """获取网站图标 - 多级降级策略
        
        获取优先级：
        1. favicon 第三方库（如果可用）- 自动查找各种可能的图标位置
        2. HTML 中的图标链接（按 rel 类型优先级）
           - apple-touch-icon: iOS 设备主屏幕图标
           - apple-touch-icon-precomposed: 不添加系统效果的 iOS 图标
           - icon: 标准网页图标
           - shortcut icon: IE 传统图标
           - mask-icon: Safari 固定标签页图标
           - icon shortcut: 组合类型
        3. 默认路径 /favicon.ico - 最后的降级方案
        
        Args:
            url (str): 网站 URL
            soup (BeautifulSoup): 解析后的 HTML 对象
            
        Returns:
            dict: 包含以下字段的字典：
                - iconData: Base64 编码的图标数据（Data URI 格式）
                - iconCanFetch: 是否成功获取（布尔值）
                - iconFetchAttempts: 尝试次数（整数）
                - iconLastFetchTime: 最后获取时间（ISO 格式字符串）
                
        Example:
            >>> response = requests.get("https://www.google.com")
            >>> soup = BeautifulSoup(response.text, 'html.parser')
            >>> result = fetcher.fetch_favicon("https://www.google.com", soup)
            >>> print(result['iconData'][:50])
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
        """
        domain = self.extract_domain(url)
        parsed_base = urlparse(url)
        base_url = f"{parsed_base.scheme}://{parsed_base.netloc}"
        
        # 首先尝试 favicon 库（如果可用）
        # favicon 库会自动查找各种可能的图标位置和尺寸
        if FAVICON_AVAILABLE:
            try:
                icon = get_favicon(url)
                if icon:
                    response = self.session.get(icon.url, timeout=self.timeout)
                    if response.status_code == 200:
                        icon_data = self.build_data_uri(response.content, response.headers.get('Content-Type'))
                        return {
                            'iconData': icon_data,
                            'iconCanFetch': True,
                            'iconFetchAttempts': 1,
                            'iconLastFetchTime': datetime.now().isoformat()
                        }
            except Exception as e:
                print(f"使用 favicon 库获取 {url} 图标失败：{e}")
        
        # 定义图标选择器的优先级
        icon_selectors = [
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="mask-icon"]',
            'link[rel="icon shortcut"]',
        ]
        
        # 尝试从 HTML 中查找图标
        for selector in icon_selectors:
            icon_link = soup.select_one(selector)
            if icon_link and icon_link.get('href'):
                favicon_url = icon_link['href']
                full_favicon_url = self._resolve_url(base_url, favicon_url)
                
                try:
                    response = self.session.get(full_favicon_url, timeout=self.timeout)
                    if response.status_code == 200:
                        icon_data = self.build_data_uri(response.content, response.headers.get('Content-Type'))
                        return {
                            'iconData': icon_data,
                            'iconCanFetch': True,
                            'iconFetchAttempts': 1,
                            'iconLastFetchTime': datetime.now().isoformat()
                        }
                except Exception as e:
                    continue
        
        # 最后尝试默认的 favicon.ico 路径
        try:
            favicon_url = f'{base_url}/favicon.ico'
            response = self.session.get(favicon_url, timeout=self.timeout)
            if response.status_code == 200:
                icon_data = self.build_data_uri(response.content, response.headers.get('Content-Type'))
                return {
                    'iconData': icon_data,
                    'iconCanFetch': True,
                    'iconFetchAttempts': 1,
                    'iconLastFetchTime': datetime.now().isoformat()
                }
        except Exception as e:
            pass
        
        # 如果都失败了，返回默认值（空图标数据）
        return {
            'iconData': '',
            'iconCanFetch': False,
            'iconFetchAttempts': 1,
            'iconLastFetchTime': datetime.now().isoformat()
        }

    def _resolve_url(self, base_url, relative_url):
        """将相对 URL 解析为绝对 URL
        
        支持的相对 URL 格式：
        1. 绝对 URL（http://... 或 https://...）：直接返回
        2. 协议相对 URL（//example.com）：继承 base_url 的协议
        3. 根相对 URL（/path/to/file）：基于域名拼接
        4. 相对路径（file.html）：基于当前路径拼接
        
        为什么需要这个函数？
        - HTML 中的图标链接可能是相对路径
        - 需要将相对路径转换为完整的绝对 URL 才能发起请求
        
        Args:
            base_url (str): 基础 URL，例如 "https://www.example.com/path/page.html"
            relative_url (str): 相对 URL，例如 "/icon.png" 或 "../images/icon.svg"
            
        Returns:
            str: 完整的绝对 URL
            
        Example:
            >>> fetcher._resolve_url("https://www.example.com/path/page.html", "/icon.png")
            'https://www.example.com/icon.png'
            >>> fetcher._resolve_url("https://www.example.com/path/page.html", "../images/icon.svg")
            'https://www.example.com/images/icon.svg'
        """
        if relative_url.startswith(('http://', 'https://')):
            return relative_url
        elif relative_url.startswith('//'):
            parsed_base = urlparse(base_url)
            return f"{parsed_base.scheme}:{relative_url}"
        elif relative_url.startswith('/'):
            parsed_base = urlparse(base_url)
            return f"{parsed_base.scheme}://{parsed_base.netloc}{relative_url}"
        else:
            parsed_base = urlparse(base_url)
            # 保留当前路径的目录部分
            # rsplit('/', 1) 从右边分割一次，获取目录路径
            path_parts = parsed_base.path.rsplit('/', 1)[0] if '/' in parsed_base.path else ''
            return f"{parsed_base.scheme}://{parsed_base.netloc}{path_parts}/{relative_url}"


    def generate_svg_icon(self, url):
        """生成本地 SVG 占位图标
        
        生成规则：
        - 蓝色背景 (#4a90e2)
        - 白色文字显示域名首字母
        - 64x64 viewBox（SVG 的坐标系统）
        
        使用场景：
        - 网络图标获取失败时的降级方案
        - 避免显示空白或破损的图标
        
        Args:
            url (str): 网站 URL
            
        Returns:
            str: SVG 图标的 Data URI，可直接用作<img>标签的 src
            
        Example:
            >>> svg_uri = fetcher.generate_svg_icon("https://www.baidu.com")
            >>> print(svg_uri)
            'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA2NCA2NCI+Li4u'
        """
        domain = self.extract_domain(url)
        initial = domain[0].upper() if domain else '?'
        
        # 创建 SVG 内容
        # viewBox="0 0 64 64" 定义了 SVG 的坐标系和宽高
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#4a90e2"/>
            <text x="32" y="40" font-size="32" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">{initial}</text>
        </svg>'''
        
        # 将 SVG 内容编码为 Base64
        svg_data = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return f'data:image/svg+xml;base64,{svg_data}'
    
    def fetch_website_data(self, url):
        """获取单个网站的完整数据
        
        获取内容：
        1. 标准化 URL（normalize_url）
        2. 网站标题（多种降级方案）
           - <title>标签
           - og:title 元标签
           - <h1>标签
           - 特殊网站硬编码标题（百度、抖音等）
        3. 网站描述（多种元标签）
        4. 网站图标（网络获取 + SVG 降级）
        5. 元数据（时间戳、状态等）
        
        特殊网站处理：
        - 百度、抖音、微博等国内知名网站有硬编码的标题
        - 这些网站的<title>可能是动态的或无意义的
        
        Args:
            url (str): 网站 URL，可以是任意格式（会自动标准化）
            
        Returns:
            dict: 包含完整网站信息的字典，如果失败则返回 None
            
        Example:
            >>> data = fetcher.fetch_website_data("https://www.baidu.com")
            >>> print(data['name'])
            '百度'
            >>> print(data['url'])
            'https://www.baidu.com'
        """
        try:
            normalized_url = self.normalize_url(url)
            
            # 发送 HTTP 请求获取网页内容
            response = self.session.get(normalized_url, timeout=self.timeout)
            response.raise_for_status()  # 如果状态码不是 200，抛出异常
            
            # 手动检测和设置响应内容的编码
            # requests 有时无法正确识别网页编码，需要手动处理
            if response.encoding != 'utf-8':
                content = response.content
                # 尝试从响应头或内容中检测编码
                # apparent_encoding 是基于 chardet 库的编码检测结果
                response.encoding = response.apparent_encoding
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.fetch_title(soup)
            description = self.fetch_description(soup)
            
            # 如果没有获取到标题，尝试从其他地方获取
            if not title or title == '':
                # 尝试从 og:title 获取（Open Graph 协议）
                og_title = soup.find('meta', property='og:title')
                if og_title and og_title.get('content'):
                    title = og_title['content'].strip()
                # 尝试从 h1 获取
                if not title:
                    h1 = soup.find('h1')
                    if h1:
                        title = h1.text.strip()
                
                # 特殊网站处理（国内知名网站的硬编码标题）
                # 这些网站的<title>标签可能是动态的或无意义的，直接使用已知名称
                domain = self.extract_domain(normalized_url)
                if not title:
                    if 'baidu.com' in domain:
                        title = '百度'
                    elif 'douyin.com' in domain:
                        title = '抖音'
                    elif 'weibo.com' in domain:
                        title = '微博'
                    elif 'qq.com' in domain:
                        title = '腾讯网'
                    elif 'taobao.com' in domain:
                        title = '淘宝网'
                    elif 'jd.com' in domain:
                        title = '京东'
                    elif 'tmall.com' in domain:
                        title = '天猫'
                    elif 'sina.com.cn' in domain:
                        title = '新浪'

            # 获取图标信息（网络请求）
            icon_info = self.fetch_favicon(normalized_url, soup)
            # 生成 SVG 占位图标（本地生成，不需要网络请求）
            svg_icon = self.generate_svg_icon(normalized_url)
            
            # 组装完整的网站数据对象
            website_data = {
                'url': normalized_url,  # 标准化后的 URL
                'name': '',  # 名称字段留空，不使用
                'title': title or '',  # 使用从 title 标签获取的内容
                'description': description,  # 网站描述
                'iconData': icon_info['iconData'],  # 网络获取的图标 Base64 Data URI
                'iconGenerateData': svg_icon,  # 生成的 SVG 图标 Data URI
                'tags': [],  # 标签数组，用户可自定义
                'isMarked': False,  # 是否已标记（收藏）
                'markOrder': 0,  # 标记排序
                'visitCount': 0,  # 访问次数统计
                'lastVisited': None,  # 最后访问时间
                'createdAt': datetime.now().isoformat(),  # 创建时间（ISO 格式）
                'updatedAt': datetime.now().isoformat(),  # 更新时间（ISO 格式）
                'isActive': True,  # 是否激活
                'isHidden': False  # 是否隐藏
            }
            
            return website_data
            
        except Exception as e:
            # 捕获所有异常，避免单个网站失败影响整体流程
            print(f"获取 {url} 数据失败：{e}")
            return None
        
    def batch_fetch(self, urls):
        """批量获取网站数据（多线程并发）
        
        使用 ThreadPoolExecutor 实现并发请求，默认 5 个线程
        
        为什么使用多线程？
        - 网络请求是 I/O 密集型操作
        - 单线程等待响应时 CPU 空闲
        - 多线程可以同时处理多个请求，显著提高效率
        
        Args:
            urls (list[str]): URL 列表，例如 ["https://www.baidu.com", "https://www.google.com"]
            
        Returns:
            list[dict]: 成功获取的网站数据列表，失败的网站会被跳过
            
        Example:
            >>> urls = ["https://www.baidu.com", "https://www.google.com", "https://www.github.com"]
            >>> results = fetcher.batch_fetch(urls)
            >>> len(results)
            3
        """
        results = []
        
        # 使用线程池并发执行
        # max_workers 控制同时运行的线程数，过多线程会增加服务器压力
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # 提交所有任务到线程池
            # futures 是一个字典：{Future 对象：URL}
            # Future 代表异步执行的操作，可以通过它获取结果
            futures = {executor.submit(self.fetch_website_data, url): url for url in urls}
            
            # 进度条显示
            # total=len(urls) 设置总任务数
            # desc 是进度条的描述文字
            with tqdm(total=len(urls), desc="获取网站数据") as pbar:
                # as_completed 会在每个 Future 完成时 yield 该 Future
                for future in as_completed(futures):
                    url = futures[future]
                    try:
                        # future.result() 会阻塞直到任务完成，并返回结果
                        result = future.result()
                        if result:
                            results.append(result)
                            pbar.set_postfix({'status': '✓', 'url': url[:30]})
                        else:
                            pbar.set_postfix({'status': '✗', 'url': url[:30]})
                    except Exception as e:
                        # 捕获任务执行过程中的异常
                        pbar.set_postfix({'status': '✗', 'url': url[:30]})
                    pbar.update(1)  # 更新进度条
        
        return results
    
    def load_existing_data(self, filename='websites.json'):
        """加载已有的网站数据
        
        支持两种 JSON 格式：
        1. 直接的数组格式：[{...}, {...}]
        2. 包含 websites 键的对象：{"websites": [{...}, {...}]}
        
        为什么需要支持两种格式？
        - 不同版本的导出格式可能不同
        - 提高兼容性和容错性
        
        Args:
            filename (str, optional): JSON 文件名，默认 'websites.json'
            
        Returns:
            dict: 以 URL 为键的字典，用于快速查找，例如 {"https://www.baidu.com": {...}}
            
        Example:
            >>> existing = fetcher.load_existing_data('backup.json')
            >>> print(len(existing))
            50
        """
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 检查数据结构：如果是包含 websites 键的对象，则提取该数组
                if isinstance(data, dict) and 'websites' in data:
                    data = data['websites']
                # 转换为以 URL 为键的字典
                # 这样可以通过 URL 快速查找已存在的网站数据
                return {item['url']: item for item in data}
        except FileNotFoundError:
            # 文件不存在时返回空字典
            return {}
    
    def batch_fetch_incremental(self, urls, existing_data=None):
        """增量获取网站数据（只获取新的 URL）
        
        使用场景：
        - 已有部分数据，只需补充新增的 URL
        - 避免重复请求，节省时间和带宽
        - 支持断点续传
        
        工作原理：
        1. 加载已有数据（或从参数获取）
        2. 过滤出尚未获取的 URL
        3. 只获取新的 URL
        4. 返回新获取的数据
        
        Args:
            urls (list[str]): 完整的 URL 列表（包含新旧 URL）
            existing_data (dict, optional): 已有数据（URL 为键的字典），如果为 None 则自动加载
            
        Returns:
            list[dict]: 新获取的网站数据列表
            
        Example:
            >>> # 假设已有 10 个网站数据
            >>> existing = fetcher.load_existing_data()
            >>> # 新增 5 个 URL，其中 3 个是新的
            >>> new_urls = ["https://new1.com", "https://new2.com", "https://existing.com"]
            >>> new_data = fetcher.batch_fetch_incremental(new_urls, existing)
            >>> len(new_data)
            2
        """
        if existing_data is None:
            existing_data = {}
        
        # 过滤出新的 URL
        # 只获取尚未存在于 existing_data 中的 URL
        new_urls = [url for url in urls if url not in existing_data]
        
        if not new_urls:
            print("没有需要获取的新 URL")
            return []
        
        print(f"总共 {len(urls)} 个 URL，其中 {len(new_urls)} 个需要获取")
        
        return self.batch_fetch(new_urls)
    
    def save_to_json(self, data, filename='websites.json'):
        """保存数据到 JSON 文件
        
        使用 UTF-8 编码，格式化输出（缩进 2 空格）
        
        参数说明：
        - ensure_ascii=False: 允许输出非 ASCII 字符（如中文），而不是\\uXXXX 转义
        - indent=2: 格式化输出，缩进 2 空格，便于阅读
        
        Args:
            data (list|dict): 要保存的数据，可以是列表或字典
            filename (str, optional): 输出文件名，默认 'websites.json'
            
        Example:
            >>> data = [{'url': 'https://www.baidu.com', 'name': '百度'}]
            >>> fetcher.save_to_json(data, 'baidu.json')
            数据已保存到 baidu.json
        """
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"数据已保存到 {filename}")
