"""
Icon Fetcher - 网站图标获取模块

功能：
- 获取网站 favicon 图标
- 支持多种图标源查找
- 生成 SVG 占位图标作为降级方案
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
import base64
import logging

# 尝试导入 favicon 库（可选依赖）
try:
    from favicon import get_favicon
    FAVICON_AVAILABLE = True
except ImportError:
    FAVICON_AVAILABLE = False


class IconFetcher:
    """网站图标获取器
    
    主要功能：
    1. 从网络获取 favicon
    2. 生成 SVG 占位图标
    3. 多级降级策略
    
    属性：
        timeout (int): 请求超时时间（秒）
        session (requests.Session): 配置好的会话对象
        logger (logging.Logger): 日志记录器
    """
    
    def __init__(self, timeout=10, logger=None):
        """初始化图标获取器
        
        Args:
            timeout (int, optional): 请求超时时间，默认 10 秒
            logger (logging.Logger, optional): 日志记录器
        """
        self.timeout = timeout
        self.session = self._create_session()
        
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('WebsiteFetcher.IconFetcher')
            if not self.logger.handlers:
                handler = logging.StreamHandler()
                handler.setFormatter(logging.Formatter('%(asctime)s\t%(levelname)s\t%(message)s'))
                self.logger.addHandler(handler)
                self.logger.setLevel(logging.INFO)
    
    def _create_session(self):
        """创建带有重试机制的 HTTP Session
        
      Returns:
          requests.Session: 配置好的会话对象
        """
        session = requests.Session()
        
        retry_strategy = requests.adapters.Retry(
            total=2,
            backoff_factor=0.5,
          status_forcelist=[429, 500, 502, 503, 504],
            raise_on_status=False,
            allowed_methods=['GET', 'HEAD'],
        )
        
        adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
        })
        
        return session
    
    def fetch_icon(self, url, soup=None):
        """获取网站图标
        
        获取策略：
        1. favicon 库（如果可用）
        2. HTML 中的图标链接
        3. 默认路径 /favicon.ico
        4. 生成 SVG 占位图标
        
        Args:
            url (str): 网站 URL
            soup (BeautifulSoup, optional): 已解析的 HTML 对象
            
        Returns:
            dict: {
                'iconData': str (Base64 Data URI),
                'iconGenerateData': str (SVG Data URI)
            }
        """
        try:
            normalized_url = self.normalize_url(url)
            
            # 如果没有提供 soup，重新获取
            if soup is None:
                response = self.session.get(normalized_url, timeout=self.timeout, verify=False)
                soup = BeautifulSoup(response.text, 'html.parser')
            
            # 获取网络图标
            icon_info = self._fetch_favicon(normalized_url, soup)
            
            # 生成 SVG 占位图标
            svg_icon = self.generate_svg_icon(normalized_url)
            
            return {
                'iconData': icon_info['iconData'],
                'iconGenerateData': svg_icon,
                'iconCanFetch': icon_info.get('iconCanFetch', False),
                'iconFetchAttempts': icon_info.get('iconFetchAttempts', 1),
                'iconLastFetchTime': icon_info.get('iconLastFetchTime')
            }
            
        except Exception as e:
            self.logger.error('FETCH_ICON_ERROR\t%s\t%s\t%s', url, type(e).__name__, str(e))
            # 失败时返回 SVG 图标
            return {
                'iconData': '',
                'iconGenerateData': self.generate_svg_icon(url),
                'iconCanFetch': False,
                'iconFetchAttempts': 1,
                'iconLastFetchTime': None
            }
    
    def _fetch_favicon(self, url, soup):
        """获取网站 favicon - 多级降级策略
        
        Args:
            url(str): 网站 URL
            soup (BeautifulSoup): 解析后的 HTML 对象
            
      Returns:
            dict: 包含 iconData 等信息的字典
        """
        domain = self.extract_domain(url)
        parsed_base = urlparse(url)
        base_url = f"{parsed_base.scheme}://{parsed_base.netloc}"
        
        # 1. 尝试 favicon 库
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
                        'iconLastFetchTime': None
                    }
            except Exception as e:
                self.logger.debug("使用 favicon 库获取 %s 图标失败：%s", url, e)
        
        # 2. 尝试从 HTML 中查找图标
        icon_selectors = [
            'link[rel="apple-touch-icon"]',
            'link[rel="apple-touch-icon-precomposed"]',
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="mask-icon"]',
            'link[rel="icon shortcut"]',
        ]
        
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
                            'iconLastFetchTime': None
                        }
                except Exception as e:
                    continue
        
        # 3. 尝试默认路径 /favicon.ico
        try:
            favicon_url = f'{base_url}/favicon.ico'
            response = self.session.get(favicon_url, timeout=self.timeout)
            if response.status_code == 200:
                icon_data = self.build_data_uri(response.content, response.headers.get('Content-Type'))
                return {
                    'iconData': icon_data,
                    'iconCanFetch': True,
                    'iconFetchAttempts': 1,
                    'iconLastFetchTime': None
                }
        except Exception as e:
            pass
        
        # 4. 所有方案都失败
        return {
            'iconData': '',
            'iconCanFetch': False,
            'iconFetchAttempts': 1,
            'iconLastFetchTime': None
        }
    
    def generate_svg_icon(self, url):
        """生成本地 SVG 占位图标
        
        Args:
            url (str): 网站 URL
            
        Returns:
            str: SVG 图标的 Data URI
        """
        domain = self.extract_domain(url)
        initial = domain[0].upper() if domain else '?'
        
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#4a90e2"/>
            <text x="32" y="40" font-size="32" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">{initial}</text>
        </svg>'''
        
        svg_data = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return f'data:image/svg+xml;base64,{svg_data}'
    
    def extract_domain(self, url):
        """提取域名
        
        Args:
            url (str): 完整 URL
            
        Returns:
            str: 域名部分
        """
        parsed = urlparse(url)
        return parsed.netloc
    
    def normalize_url(self, url):
        """标准化 URL 格式
        
        Args:
            url(str): 原始 URL
            
        Returns:
            str: 标准化后的 URL
        """
        url = url.strip()
        
        if not url.startswith('http://') and not url.startswith('https://'):
            url = 'https://' + url
        
        parsed = urlparse(url)
        scheme = 'https'
        
        normalized = urlunparse((
            scheme,
            parsed.netloc.lower(),
            parsed.path,
            parsed.params,
            parsed.query,
            parsed.fragment
        ))
        
        return normalized
    
    def _resolve_url(self, base_url, relative_url):
        """将相对 URL 解析为绝对 URL
        
        Args:
            base_url (str): 基础 URL
            relative_url(str): 相对 URL
            
        Returns:
            str: 完整的绝对 URL
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
            path_parts = parsed_base.path.rsplit('/', 1)[0] if '/' in parsed_base.path else ''
            return f"{parsed_base.scheme}://{parsed_base.netloc}{path_parts}/{relative_url}"
    
    def build_data_uri(self, binary_data, content_type=None):
        """构建完整的 Data URI
        
        Args:
            binary_data (bytes): 图片二进制数据
            content_type (str, optional): HTTP 响应头中的 Content-Type
            
        Returns:
            str: 完整的 Data URI
        """
        # 首先尝试从 Content-Type 获取格式
        icon_format = self._get_mime_type_from_content_type(content_type)
        
        # 如果 Content-Type 无效，使用文件头检测
        if not icon_format:
            icon_format = self.detect_image_format(binary_data)
        
        icon_data = base64.b64encode(binary_data).decode('utf-8')
        return f'data:image/{icon_format};base64,{icon_data}'
    
    def _get_mime_type_from_content_type(self, content_type):
        """从 HTTP Content-Type 提取 MIME 类型
        
        Args:
            content_type (str): HTTP 响应头 Content-Type
            
        Returns:
            str: 图片格式名称
        """
        if not content_type:
            return None
        
        format_map = {
            'image/png': 'png',
            'image/jpeg': 'jpeg',
            'image/gif': 'gif',
            'image/x-icon': 'x-icon',
            'image/vnd.microsoft.icon': 'x-icon',
            'image/svg+xml': 'svg+xml',
            'image/webp': 'webp',
        }
        
        content_type_lower = content_type.lower()
        for mime_type, format_name in format_map.items():
            if mime_type in content_type_lower:
                return format_name
        
        return None
    
    def detect_image_format(self, binary_data):
        """根据文件头（魔数）检测图像格式
        
        Args:
            binary_data (bytes): 图片二进制数据
            
        Returns:
            str: 图片格式名称
        """
        if len(binary_data) < 4:
            return 'png'
        
        # PNG: 89 50 4E 47
        if binary_data[:4] == b'\x89PNG':
            return 'png'
        
        # JPEG: FF D8 FF
        if binary_data[:3] == b'\xff\xd8\xff':
            return 'jpeg'
        
        # GIF: 47 49 46 38
        if binary_data[:4] == b'GIF8':
            return 'gif'
        
        # ICO: 00 00 01 00
        if binary_data[:4] == b'\x00\x00\x01\x00':
            return 'x-icon'
        
        # SVG: XML 声明或<svg 标签
        if b'<?xml' in binary_data[:100] or b'<svg' in binary_data[:100]:
            return 'svg+xml'
        
        return 'png'
