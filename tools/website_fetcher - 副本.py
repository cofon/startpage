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
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
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
        """获取网站标题"""
        title_tag = soup.find('title')
        if title_tag:
            return title_tag.text.strip()
        return ''
    
    def fetch_description(self, soup):
        """获取网站描述"""
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
                    return desc
        
        return ''
    
    def fetch_favicon(self, url, soup):
        """获取网站图标"""
        domain = self.extract_domain(url)
        
        if FAVICON_AVAILABLE:
            try:
                icon = get_favicon(url)
                if icon:
                    response = self.session.get(icon.url, timeout=self.timeout)
                    if response.status_code == 200:
                        icon_data = base64.b64encode(response.content).decode('utf-8')
                        return {
                            'iconData': icon_data,
                            'iconCanFetch': True,
                            'iconFetchAttempts': 1,
                            'iconLastFetchTime': datetime.now().isoformat()
                        }
            except Exception as e:
                print(f"使用favicon库获取 {url} 图标失败: {e}")
        
        icon_selectors = [
            'link[rel="icon"]',
            'link[rel="shortcut icon"]',
            'link[rel="apple-touch-icon"]',
        ]
        
        for selector in icon_selectors:
            icon_link = soup.select_one(selector)
            if icon_link and icon_link.get('href'):
                favicon_url = icon_link['href']
                
                if not favicon_url.startswith('http'):
                    if favicon_url.startswith('//'):
                        favicon_url = 'https:' + favicon_url
                    elif favicon_url.startswith('/'):
                        favicon_url = f'https://{domain}{favicon_url}'
                    else:
                        favicon_url = f'https://{domain}/{favicon_url}'
                
                try:
                    response = self.session.get(favicon_url, timeout=self.timeout)
                    if response.status_code == 200:
                        icon_data = base64.b64encode(response.content).decode('utf-8')
                        return {
                            'iconData': icon_data,
                            'iconCanFetch': True,
                            'iconFetchAttempts': 1,
                            'iconLastFetchTime': datetime.now().isoformat()
                        }
                except Exception as e:
                    continue
        
        try:
            favicon_url = f'https://{domain}/favicon.ico'
            response = self.session.get(favicon_url, timeout=self.timeout)
            if response.status_code == 200:
                icon_data = base64.b64encode(response.content).decode('utf-8')
                return {
                    'iconData': icon_data,
                    'iconCanFetch': True,
                    'iconFetchAttempts': 1,
                    'iconLastFetchTime': datetime.now().isoformat()
                }
        except Exception as e:
            pass
        
        return {
            'iconData': '',
            'iconCanFetch': False,
            'iconFetchAttempts': 1,
            'iconLastFetchTime': datetime.now().isoformat()
        }
    
    def generate_svg_icon(self, url):
        """生成本地SVG图标"""
        domain = self.extract_domain(url)
        initial = domain[0].upper() if domain else '?'
        
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
            <rect width="64" height="64" fill="#4a90e2"/>
            <text x="32" y="40" font-size="32" text-anchor="middle" fill="white" font-family="Arial, sans-serif" font-weight="bold">{initial}</text>
        </svg>'''
        
        svg_data = base64.b64encode(svg.encode('utf-8')).decode('utf-8')
        return svg_data
    
    def fetch_website_data(self, url):
        """获取单个网站的数据"""
        try:
            normalized_url = self.normalize_url(url)
            
            response = self.session.get(normalized_url, timeout=self.timeout)
            response.raise_for_status()
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.fetch_title(soup)
            description = self.fetch_description(soup)
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
