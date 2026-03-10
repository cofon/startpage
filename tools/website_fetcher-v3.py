"""
Website Fetcher - 网站数据获取工具

功能说明：
- 批量获取网站的标题、描述、图标等信息
- 支持多线程并发请求，提高效率
- 自动检测并转换图片格式为 Base64 Data URI
- 为无法获取图标的网站生成SVG 占位图标
- 支持增量获取和断点续传
- 支持从起始页项目导出的 JSON 文件中加载并更新 websites 数据

使用示例：

1. 基本用法 - 从 URL 列表获取数据：
    fetcher = WebsiteFetcher(max_workers=5, timeout=10)
    urls = ['https://www.baidu.com', 'https://www.google.com']
    websites = fetcher.batch_fetch(urls)
    # 注意：现在不再保存到 websites.json

2. 从起始页导出文件更新数据：
    fetcher = WebsiteFetcher()
    # 从起始页备份文件加载并更新缺失的 title/description/iconData
    updated_websites = fetcher.update_websites_from_export(
        'startpage-backup-20260309-132958.json',
        output_filename='websites-updated.json'  # 可选，保存结果
    )
    
3. 单独加载导出文件：
    fetcher = WebsiteFetcher()
    websites = fetcher.load_startpage_export('startpage-backup-20260309-132958.json')

WebsiteFetcher - 网站数据获取工具

功能说明：
- 批量获取网站的标题、描述、图标等信息
- 支持多线程并发请求，提高效率
- 自动检测并转换图片格式为 Base64 Data URI
- 为无法获取图标的网站生成SVG 占位图标
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
import logging
import urllib3

# 禁用 SSL 警告（因为某些网站证书可能无效）
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

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
        logger (logging.Logger): 日志记录器
    """
    
    def __init__(self, max_workers=5, timeout=10, logger=None):
        """初始化工具类
        
        Args:
            max_workers (int, optional): 最大并发数，默认 5 个线程
            timeout (int, optional): 请求超时时间，默认 10 秒
            logger (logging.Logger, optional): 日志记录器，如果不提供则创建默认 logger
            
        Example:
            >>> fetcher = WebsiteFetcher(max_workers=10, timeout=15)
            >>> # 创建一个最多 10 个线程，请求超时 15 秒的获取器
        """
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = self._create_session()
        
        # 配置日志记录器
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('WebsiteFetcher.WebsiteFetcher')
            if not self.logger.handlers:
                handler = logging.StreamHandler()
                handler.setFormatter(logging.Formatter('%(asctime)s\t%(levelname)s\t%(message)s'))
                self.logger.addHandler(handler)
                self.logger.setLevel(logging.INFO)

    def _create_session(self):
        """创建带有重试机制的 HTTP Session
        
        配置内容：
        - User-Agent 模拟真实浏览器
        - 自动重试策略（针对 429/500/502/503/504 错误）
        - 指数退避（backoff_factor=1）
        
        Returns:
            requests.Session: 配置好的会话对象，可用于发送 HTTP 请求
        """
        session = requests.Session()
        
        # 配置重试策略
        retry_strategy = requests.adapters.Retry(
            total=2,  # 总重试次数（减少到 2 次，避免过长等待）
            backoff_factor=0.5,  # 退避因子：重试间隔 = backoff_factor * (2 ** (重试次数 - 1))
            status_forcelist=[429, 500, 502, 503, 504],  # 强制重试的状态码
            raise_on_status=False,  # 不抛出异常，直接返回错误响应
            allowed_methods=['GET', 'HEAD'],  # 只对 GET 和 HEAD 请求重试
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
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',  # Do Not Track
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
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
            # verify=False 禁用 SSL 证书验证（仅开发环境使用）
            # timeout=(connect_timeout, read_timeout) 分别设置连接和读取超时
            response = self.session.get(
                normalized_url, 
                timeout=(5, 15),  # 连接超时 5 秒，读取超时 15 秒
                verify=False
            )
            
            # 调试信息：如果是知乎网站，输出详细数据（在检查状态码之前）
            self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
            self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
            self.logger.info('DEBUG_ZHIHU_HEADERS: %s', dict(response.headers))
            self.logger.info('DEBUG_ZHIHU_HTML_LENGTH: %d', len(response.text))
            self.logger.info('DEBUG_ZHIHU_HTML_PREVIEW: %s', response.text[:2000])
            self.logger.info('DEBUG_ZHIHU_HTML_LENGTH: %d', len(response.text))
            self.logger.info('DEBUG_ZHIHU_HTML_PREVIEW: %s', response.text[:2000])
            
            response.raise_for_status()  # 如果状态码不是 200，抛出异常
            
            # 手动检测和设置响应内容的编码
            # requests 有时无法正确识别网页编码，需要手动处理
            if response.encoding != 'utf-8':
                content = response.content
                # 尝试从响应头或内容中检测编码
                # apparent_encoding 是基于 chardet 库的编码检测结果
                response.encoding = response.apparent_encoding
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 调试信息：如果是知乎网站，输出详细数据
            domain = self.extract_domain(normalized_url)
            if 'zhihu.com' in domain:
             self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
             self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
             self.logger.info('DEBUG_ZHIHU_HTML: %s', response.text[:3000])
            
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
            error_type = type(e).__name__
            self.logger.error(f'FETCH_ERROR\t{error_type}\t{url}\t{str(e)}')
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
        self.logger.info(f'BATCH_FETCH_START\tTOTAL_URLS\t{len(urls)}')
        results = []
        success_count = 0
        failed_urls = []
        processed_count = 0
        
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
                        processed_count += 1
                        
                        if result:
                            results.append(result)
                            success_count += 1
                            pbar.set_postfix({'status': '✓', 'url': url[:30], 'progress': f'{processed_count}/{len(urls)}'})
                            self.logger.info(f'FETCH_SUCCESS\t{url}\t{result.get("title", "N/A")}')
                        else:
                            pbar.set_postfix({'status': '✗', 'url': url[:30], 'progress': f'{processed_count}/{len(urls)}'})
                            failed_urls.append(url)
                            self.logger.warning(f'FETCH_FAILED\tNO_DATA\t{url}')
                        
                        # 更新进度条
                        pbar.update(1)
                        
                    except Exception as e:
                        # 捕获任务执行过程中的异常
                        processed_count += 1
                        pbar.set_postfix({'status': '✗', 'url': url[:30], 'error': type(e).__name__})
                        failed_urls.append(url)
                        self.logger.error(f'TASK_ERROR\t{type(e).__name__}\t{url}\t{str(e)}')
                        # 继续处理下一个，不因单个错误中断整体流程
                        
                        # 更新进度条
                        pbar.update(1)

        self.logger.info(f'BATCH_FETCH_END\tTOTAL_URLS\t{len(urls)}\tSUCCESS\t{success_count}\tFAILED\t{len(failed_urls)}')
        print(f"\n✅ 成功获取 {success_count}/{len(urls)} 个网站数据")
        if failed_urls:
            print(f"⚠️  失败 {len(failed_urls)} 个网站（已记录到日志）")
        return results
    
    
    def load_startpage_export(self, filename):
        """从起始页项目导出的 JSON 文件中加载 websites 数据
        
        起始页项目导出的 JSON 格式：
        {
          "websites": [{ website1 }, { website2 }, { website3 }],
          "settings": { settings },
          "themes": [{ theme1 }, { theme2 }, { theme3 }],
          "searchEngines": [{ searchEngine1 }, { searchEngine2 }, { searchEngine3 }]
        }
        
        Args:
            filename (str): 起始页导出的 JSON 文件名，例如 'startpage-backup-20260309-132958.json'
            
        Returns:
            list[dict]: websites 数组，如果文件不存在或格式错误则返回空列表
            
        Example:
            >>> websites = fetcher.load_startpage_export('startpage-backup-20260309-132958.json')
            >>> print(len(websites))
            50
        """
        full_data = self.load_startpage_export_full(filename)
        if full_data and 'websites' in full_data:
            return full_data['websites']
        return []
    
    def load_startpage_export_full(self, filename):
        """从起始页项目导出的 JSON 文件中加载完整数据
        
        起始页项目导出的 JSON 格式：
        {
          "websites": [{ website1 }, { website2 }, { website3 }],
          "settings": { settings },
          "themes": [{ theme1 }, { theme2 }, { theme3 }],
          "searchEngines": [{ searchEngine1 }, { searchEngine2 }, { searchEngine3 }]
        }
        
        Args:
            filename (str): 起始页导出的 JSON 文件名，例如 'startpage-backup-20260309-132958.json'
            
        Returns:
            dict: 完整的导出数据，包含 websites、settings、themes、searchEngines，如果文件不存在或格式错误则返回 None
            
        Example:
            >>> data = fetcher.load_startpage_export_full('startpage-backup-20260309-132958.json')
            >>> print(data['websites'])
            [...]
            >>> print(data['settings'])
            {...}
        """
        self.logger.info(f'LOAD_FILE_START\t{filename}')
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 检查是否是有效的字典结构
                if isinstance(data, dict):
                    self.logger.info(f'LOAD_FILE_SUCCESS\tWEBSITES_COUNT\t{len(data.get("websites", []))}')
                    print(f"从 {filename} 中加载了 {len(data.get('websites', []))} 个网站")
                    return data
                else:
                    self.logger.warning(f'LOAD_FILE_WARNING\tINVALID_FORMAT\t{filename}')
                    print(f"警告：{filename} 格式不正确，未找到数据结构")
                    return None
        except FileNotFoundError:
            self.logger.error(f'LOAD_FILE_ERROR\tFILE_NOT_FOUND\t{filename}')
            print(f"错误：文件 {filename} 不存在")
            return None
        except json.JSONDecodeError as e:
            self.logger.error(f'LOAD_FILE_ERROR\tJSON_DECODE_ERROR\t{filename}\t{str(e)}')
            print(f"错误：{filename} 不是有效的 JSON 文件：{e}")
            return None

    def update_websites_from_export(self, export_filename, output_filename=None):
        """从起始页导出的 JSON 文件中获取并更新 websites 数据
        
        处理逻辑：
        1. 加载导出文件中的完整数据（包括 websites、settings、themes、searchEngines）
        2. 遍历 websites 数组，检查并补充缺失的字段
        3. 对于 title、description、iconData 为空的项，重新获取数据
        4. 为缺少 iconGenerateData 的网站生成 SVG 图标（同一域名使用相同 SVG）
        5. 可选择保存结果到文件（如果指定 output_filename），保持原始 JSON 结构
        
        Args:
            export_filename (str): 起始页导出的 JSON 文件名
            output_filename (str, optional): 输出文件名，如果为 None 则不保存
            
        Returns:
            list[dict]: 更新后的 websites 列表
            
        Example:
            >>> updated = fetcher.update_websites_from_export('startpage-backup-20260309-132958.json')
            >>> print(f"更新了 {len(updated)} 个网站")
        """
        self.logger.info(f'UPDATE_START\tEXPORT_FILE\t{export_filename}')
        
        # 加载导出文件的完整数据
        full_data = self.load_startpage_export_full(export_filename)
        
        if not full_data or 'websites' not in full_data:
            self.logger.warning('UPDATE_WARNING\tNO_DATA\tNo websites to process')
            print("没有需要处理的网站数据")
            return []
        
        websites = full_data['websites']
        
        if not websites:
            self.logger.warning('UPDATE_WARNING\tEMPTY_WEBSITES\twebsites array is empty')
            print("没有需要处理的网站数据")
            return []
        
        total_count = len(websites)
        self.logger.info(f'PROCESSING_START\tTOTAL_WEBSITES\t{total_count}')
        print(f"开始处理 {len(websites)} 个网站...")
        
        # 需要补充数据的网站 URL 列表
        urls_to_fetch = []
        
        # 统计各字段缺失情况
        missing_title = 0
        missing_description = 0
        missing_icon = 0
        missing_svg = 0
        
        # 域名到 SVG 图标的映射缓存，确保同一域名使用相同 SVG
        domain_svg_cache = {}
        
        # 第一次遍历：识别需要补充数据的网站
        for website in websites:
            needs_update = False
            
            # 检查 title 是否为空
            if not website.get('title'):
                needs_update = True
                missing_title += 1
            
            # 检查 description 是否为空
            if not website.get('description'):
                needs_update = True
                missing_description += 1
            
            # 检查 iconData 是否为空
            if not website.get('iconData'):
                needs_update = True
                missing_icon += 1
            
            if needs_update and website.get('url'):
                urls_to_fetch.append(website['url'])
        
        if not urls_to_fetch:
            self.logger.info('UPDATE_INFO\tALL_COMPLETE\tNo updates needed')
            print("所有网站数据都已完整，无需更新")
        else:
            self.logger.info(f'MISSING_FIELDS_STATISTICS\tTITLE\t{missing_title}\tDESCRIPTION\t{missing_description}\tICONDATA\t{missing_icon}')
            self.logger.info(f'URLS_TO_FETCH\tCOUNT\t{len(urls_to_fetch)}')
            print(f"发现 {len(urls_to_fetch)} 个网站需要补充数据")
            
            # 批量获取需要补充的数据
            fetched_data_list = self.batch_fetch(urls_to_fetch)
            
            # 创建 URL 到获取数据的映射，便于快速查找
            fetched_map = {data['url']: data for data in fetched_data_list}
            
            # 第二次遍历：更新 websites 数据
            updated_count = 0
            for website in websites:
                url = website.get('url')
                if not url:
                    continue
                
                # 如果有获取到的数据，更新对应字段
                if url in fetched_map:
                    fetched = fetched_map[url]
                    
                    # 更新 title 字段（如果原为空）
                    if not website.get('title') and fetched.get('title'):
                        website['title'] = fetched['title']
                    
                    # 更新 description 字段（如果原为空）
                    if not website.get('description') and fetched.get('description'):
                        website['description'] = fetched['description']
                    
                    # 更新 iconData 字段（如果原为空）
                    if not website.get('iconData') and fetched.get('iconData'):
                        website['iconData'] = fetched['iconData']
                    
                    updated_count += 1
        
        # 第三次遍历：为缺少 iconGenerateData 的网站补充SVG 图标
        # 优化策略：
        # 1. 先收集所有已有 iconGenerateData 的域名和 SVG
        # 2. 对于缺少 SVG 的网站，优先使用同域名的已有 SVG
        # 3. 只有当同域名没有任何 SVG 时，才生成新的 SVG
        
        svg_generated_count = 0
        svg_reused_count = 0
        domain_svg_cache = {}
        
        # 第一次遍历：收集所有已有 iconGenerateData 的域名
        self.logger.info('SVG_COLLECTION_START\tCollecting existing SVGs')
        for website in websites:
            url = website.get('url')
            if not url:
                continue
            
            icon_data = website.get('iconGenerateData')
            if icon_data:
                domain = self.extract_domain(url)
                # 如果该域名还没有缓存，则存入（保留第一个遇到的）
                if domain not in domain_svg_cache:
                    domain_svg_cache[domain] = icon_data
                    self.logger.info(f'SVG_COLLECTED\t{domain}\t{url}')
        
        self.logger.info(f'SVG_COLLECTION_END\tDOMAINS_WITH_SVG\t{len(domain_svg_cache)}')
        
        # 第二次遍历：为缺少 iconGenerateData 的网站补充 SVG
        for website in websites:
            url = website.get('url')
            if not url:
                continue
            
            # 检查是否需要补充 SVG
            if not website.get('iconGenerateData'):
                domain = self.extract_domain(url)
                
                # 检查是否已经为该域名收集或生成过 SVG
                if domain in domain_svg_cache:
                    # 使用该域名已有的 SVG（可能是收集的，也可能是生成的）
                    website['iconGenerateData'] = domain_svg_cache[domain]
                    svg_reused_count += 1
                    self.logger.info(f'SVG_REUSED\t{domain}\t{url}')
                else:
                    # 该域名没有任何 SVG，生成新的并缓存
                    svg_icon = self.generate_svg_icon(url)
                    website['iconGenerateData'] = svg_icon
                    domain_svg_cache[domain] = svg_icon
                    svg_generated_count += 1
                    self.logger.info(f'SVG_GENERATED\t{domain}\t{url}')
        
        self.logger.info(f'SVG_GENERATION_COMPLETE\tGENERATED\t{svg_generated_count}\tREUSED\t{svg_reused_count}\tTOTAL_DOMAINS\t{len(domain_svg_cache)}')
        print(f"为 {svg_generated_count} 个网站生成了 SVG 图标，复用了 {svg_reused_count} 个同域名的 SVG")
        
        # 如果指定了输出文件名，保存完整的 JSON 结构
        if output_filename:
            self.save_full_data_to_json(full_data, output_filename)
            self.logger.info(f'OUTPUT_SAVED\t{output_filename}')
        
        return websites
    
    def save_full_data_to_json(self, full_data, filename='websites-updated.json'):
        """保存完整的起始页导出数据到 JSON 文件
        
        保持与输入文件相同的结构，包含 websites、settings、themes、searchEngines
        
        Args:
            full_data (dict): 完整的导出数据
            filename (str, optional): 输出文件名，默认 'websites-updated.json'
        """
        self.logger.info(f'SAVE_FILE_START\t{filename}\tWEBSITES_COUNT\t{len(full_data.get("websites", []))}')
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(full_data, f, ensure_ascii=False, indent=2)
            self.logger.info(f'SAVE_FILE_SUCCESS\t{filename}')
            print(f"数据已保存到 {filename}")
        except Exception as e:
            self.logger.error(f'SAVE_FILE_ERROR\t{filename}\t{str(e)}')
            print(f"保存文件失败：{e}")
            raise
