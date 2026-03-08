"""
Website Fetcher - 网站数据获取工具
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
import json
import base64
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from datetime import datetime

try:
    from favicon import get_favicon
    FAVICON_AVAILABLE = True
except ImportError:
    FAVICON_AVAILABLE = False


class WebsiteFetcher:
    """网站数据获取器"""
    
    def __init__(self, max_workers=5, timeout=10):
        self.max_workers = max_workers
        self.timeout = timeout
        self.session = self._create_session()
    
    def _create_session(self):
        """创建带有重试机制的session"""
        session = requests.Session()
        
        retry_strategy = requests.adapters.Retry(
            total=3,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
        )
        
        adapter = requests.adapters.HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
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
        """标准化URL"""
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
    
    def extract_domain(self, url):
        """提取域名"""
        parsed = urlparse(url)
        return parsed.netloc
    
    def fetch_title(self, soup):
        """获取网站标题并确保UTF-8编码"""
        title_tag = soup.find('title')
        if title_tag:
            title = title_tag.text.strip()
            # 确保字符串是有效的UTF-8
            title = self._ensure_utf8(title)
            # 过滤掉一些无意义的标题
            if title and title not in ['Sina Visitor System', '正在跳转...', 'Redirecting...', 'Please Wait...']:
                return title
        return ''

    def fetch_description(self, soup):
        """获取网站描述并确保UTF-8编码"""
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
                    # 确保字符串是有效的UTF-8
                    return self._ensure_utf8(desc)
        
        return ''

    def _ensure_utf8(self, text):
        """确保文本是有效的UTF-8编码"""
        if isinstance(text, str):
            # 尝试重新编码为UTF-8以处理潜在的编码问题
            try:
                # 先编码为bytes，再解码为UTF-8
                encoded = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
                return encoded
            except:
                return text
        return text

    def detect_image_format(self, binary_data):
        """根据文件头检测图像格式"""
        if len(binary_data) < 4:
            return 'png'  # 默认返回 png
        
        # 检查文件头（魔数）
        if binary_data.startswith(b'\x89PNG'):
            return 'png'
        elif binary_data.startswith(b'\xff\xd8\xff'):
            return 'jpeg'
        elif binary_data.startswith(b'GIF87a') or binary_data.startswith(b'GIF89a'):
            return 'gif'
        elif binary_data.startswith(b'\x00\x00\x01\x00') or binary_data.startswith(b'\x00\x00\x02\x00'):
            return 'x-icon'  # ICO 格式
        elif binary_data.startswith(b'<?xml') or b'<svg' in binary_data[:100]:
            return 'svg+xml'
        else:
            # 如果无法通过文件头检测，默认为 png
            return 'png'

    def get_mime_type_from_content_type(self, content_type):
        """从 Content-Type 头部提取 MIME 类型"""
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
        """构建完整的 Data URI"""
        # 首先尝试从 Content-Type 获取格式
        icon_format = self.get_mime_type_from_content_type(content_type)
        
        # 如果 Content-Type 无效，使用文件头检测
        if not icon_format:
            icon_format = self.detect_image_format(binary_data)
        
        # 构建 Data URI
        icon_data = base64.b64encode(binary_data).decode('utf-8')
        return f'data:image/{icon_format};base64,{icon_data}'

    def fetch_favicon(self, url, soup):
        """获取网站图标 - 改进版本"""
        domain = self.extract_domain(url)
        parsed_base = urlparse(url)
        base_url = f"{parsed_base.scheme}://{parsed_base.netloc}"
        
        # 首先尝试 favicon 库（如果可用）
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
        
        # 如果都失败了，返回默认值
        return {
            'iconData': '',
            'iconCanFetch': False,
            'iconFetchAttempts': 1,
            'iconLastFetchTime': datetime.now().isoformat()
        }

    def _resolve_url(self, base_url, relative_url):
        """解析相对URL为绝对URL"""
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


    def generate_svg_icon(self, url):
        """生成本地SVG图标"""
        domain = self.extract_domain(url)
        initial = domain[0].upper() if domain else '?'
        
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#4a90e2"/>
            <text x="32" y="40" font-size="32" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">{initial}</text>
        </svg>'''
        
        svg_data = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return f'data:image/svg+xml;base64,{svg_data}'
    
    def fetch_website_data(self, url):
        """获取单个网站的数据 - 改进版本"""
        try:
            normalized_url = self.normalize_url(url)
            
            # 在请求时指定编码
            response = self.session.get(normalized_url, timeout=self.timeout)
            response.raise_for_status()
            
            # 手动检测和设置响应内容的编码
            if response.encoding != 'utf-8':
                content = response.content
                # 尝试从响应头或内容中检测编码
                response.encoding = response.apparent_encoding
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.fetch_title(soup)
            description = self.fetch_description(soup)
            
            # 如果没有获取到标题，尝试从其他地方获取
            if not title or title == '':
                # 尝试从 og:title 获取
                og_title = soup.find('meta', property='og:title')
                if og_title and og_title.get('content'):
                    title = og_title['content'].strip()
                # 尝试从 h1 获取
                if not title:
                    h1 = soup.find('h1')
                    if h1:
                        title = h1.text.strip()
                
                # 特殊网站处理
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

            icon_info = self.fetch_favicon(normalized_url, soup)
            svg_icon = self.generate_svg_icon(normalized_url)
            
            website_data = {
                'url': normalized_url,
                'name': title or self.extract_domain(normalized_url),
                'description': description,
                'icon': '',
                'iconUrl': '',
                'iconData': icon_info['iconData'],
                'iconGenerateData': svg_icon,
                'iconCanFetch': icon_info['iconCanFetch'],
                'iconFetchAttempts': icon_info['iconFetchAttempts'],
                'iconLastFetchTime': icon_info['iconLastFetchTime'],
                'tags': [],
                'isMarked': False,
                'markOrder': 0,
                'visitCount': 0,
                'lastVisited': None,
                'createdAt': datetime.now().isoformat(),
                'updatedAt': datetime.now().isoformat(),
                'isActive': True,
                'isHidden': False
            }
            
            return website_data
            
        except Exception as e:
            print(f"获取 {url} 数据失败: {e}")
            return None
        
    def batch_fetch(self, urls):
        """批量获取网站数据"""
        results = []
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures = {executor.submit(self.fetch_website_data, url): url for url in urls}
            
            with tqdm(total=len(urls), desc="获取网站数据") as pbar:
                for future in as_completed(futures):
                    url = futures[future]
                    try:
                        result = future.result()
                        if result:
                            results.append(result)
                            pbar.set_postfix({'status': '✓', 'url': url[:30]})
                        else:
                            pbar.set_postfix({'status': '✗', 'url': url[:30]})
                    except Exception as e:
                        pbar.set_postfix({'status': '✗', 'url': url[:30]})
                    pbar.update(1)
        
        return results
    
    def load_existing_data(self, filename='websites.json'):
        """加载已有数据"""
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)
                # 检查数据结构：如果是包含 websites 键的对象，则提取该数组
                if isinstance(data, dict) and 'websites' in data:
                    data = data['websites']
                return {item['url']: item for item in data}
        except FileNotFoundError:
            return {}
    
    def batch_fetch_incremental(self, urls, existing_data=None):
        """增量获取网站数据"""
        if existing_data is None:
            existing_data = {}
        
        new_urls = [url for url in urls if url not in existing_data]
        
        if not new_urls:
            print("没有需要获取的新URL")
            return []
        
        print(f"总共 {len(urls)} 个URL，其中 {len(new_urls)} 个需要获取")
        
        return self.batch_fetch(new_urls)
    
    def save_to_json(self, data, filename='websites.json'):
        """保存数据到JSON文件"""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"数据已保存到 {filename}")
