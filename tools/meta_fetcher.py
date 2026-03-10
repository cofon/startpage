"""
Meta Fetcher - 网站元数据获取模块

功能：
- 获取网站的 title 和 description
- 支持 Requests 和 Selenium 两种方案
- Selenium 作为备用方案处理反爬网站
"""

import requests
from bs4 import BeautifulSoup
from urllib.parse import urlparse, urlunparse
import logging
import time

# 尝试导入 selenium（可选依赖）
try:
    from selenium import webdriver
    from selenium.webdriver.chrome.options import Options
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    SELENIUM_AVAILABLE = True
except ImportError:
    SELENIUM_AVAILABLE = False


class MetaFetcher:
    """网站元数据获取器
    
    主要功能：
    1. 使用 requests 快速获取 title 和 description
    2. 使用 Selenium 处理反爬网站（备用方案）
    
    属性：
        timeout (int): 请求超时时间（秒）
        session (requests.Session): 配置好的会话对象
        logger (logging.Logger): 日志记录器
        _selenium_driver: Selenium 浏览器实例缓存
    """
    
    def __init__(self, timeout=10, logger=None):
        """初始化元数据获取器
        
        Args:
            timeout (int, optional): 请求超时时间，默认 10 秒
            logger (logging.Logger, optional): 日志记录器
        """
        self.timeout = timeout
        self.session = self._create_session()
        self._selenium_driver = None
        
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('WebsiteFetcher.MetaFetcher')
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
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Cache-Control': 'max-age=0',
            'DNT': '1',
            'Sec-Ch-Ua': '"Not_A Brand";v="8", "Chromium";v="120"',
            'Sec-Ch-Ua-Mobile': '?0',
            'Sec-Ch-Ua-Platform': '"Windows"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        })
        
        return session
    
    def fetch_meta(self, url):
        """获取网站的 title 和 description
        
        获取策略：
        1. 首先使用 requests 快速尝试
        2. 如果失败或获取不到，使用 Selenium 作为备用
        
        Args:
            url (str): 网站 URL
            
       Returns:
            dict: {'title': str, 'description': str}，失败返回 None
        """
        try:
            # 标准化 URL
            normalized_url = self.normalize_url(url)
            
            # 使用 requests 获取
            response = self.session.get(
                normalized_url,
                timeout=(5, 15),
                verify=False
            )
            response.raise_for_status()
            
            # 设置正确的编码
            if response.encoding != 'utf-8':
               response.encoding = response.apparent_encoding
            
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 提取 title 和 description
            title = self._fetch_title(soup)
            description = self._fetch_description(soup)
            
            # 如果 requests 方案失败，使用 Selenium 备用
            if not title:
                self.logger.info('SELENIUM_FALLBACK_TITLE\t%s', normalized_url)
                title = self.fetch_title_with_selenium(normalized_url)
            
            if not description:
                self.logger.info('SELENIUM_FALLBACK_DESCRIPTION\t%s', normalized_url)
                description = self.fetch_description_with_selenium(normalized_url)
            
            return {
                'title': title or '',
                'description': description or ''
            }
            
        except Exception as e:
            self.logger.error('FETCH_META_ERROR\t%s\t%s\t%s', url, type(e).__name__, str(e))
            # 如果完全失败，尝试仅用 Selenium
            try:
                normalized_url = self.normalize_url(url)
                title = self.fetch_title_with_selenium(normalized_url)
                description = self.fetch_description_with_selenium(normalized_url)
                return {
                    'title': title or '',
                    'description': description or ''
                }
            except:
               return None
    
    def _fetch_title(self, soup):
        """从 HTML 中提取 title
        
        Args:
            soup (BeautifulSoup): 解析后的 HTML 对象
            
       Returns:
           str: 网站标题
        """
        head_tag = soup.find('head')
        if head_tag:
            title_tag = head_tag.find('title')
        else:
            title_tag = soup.find('title')
        
        if title_tag:
            title = title_tag.text.strip()
            title = self._ensure_utf8(title)
            # 过滤无意义的标题
            if title and title not in ['Sina Visitor System', '正在跳转...', 'Redirecting...', 'Please Wait...']:
               return title
        return ''
    
    def _fetch_description(self, soup):
        """从 HTML 中提取 description
        
        Args:
            soup (BeautifulSoup): 解析后的 HTML 对象
            
       Returns:
           str: 网站描述
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
                return self._ensure_utf8(desc)
        
        return ''
    
    def _get_selenium_driver(self):
        """获取或创建 Selenium 浏览器实例（单例模式）
        
        Returns:
            webdriver.Chrome: Chrome WebDriver 实例
        """
        if self._selenium_driver is None:
            chrome_options = Options()
            chrome_options.add_argument('--headless=new')
            chrome_options.add_argument('--blink-settings=imagesEnabled=false')
            chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
            chrome_options.add_argument('--disable-blink-features=AutomationControlled')
            chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
            chrome_options.add_experimental_option('useAutomationExtension', False)
            
            self._selenium_driver = webdriver.Chrome(options=chrome_options)
            self._selenium_driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        return self._selenium_driver
    
    def close_selenium_driver(self):
        """关闭 Selenium 浏览器实例"""
        if self._selenium_driver is not None:
            self._selenium_driver.quit()
            self._selenium_driver = None
    
    def fetch_title_with_selenium(self, url, timeout=15):
        """使用 Selenium 获取网站标题
        
        Args:
            url (str): 网站 URL
            timeout (int, optional): 等待超时时间，默认 15 秒
            
       Returns:
           str: 网站标题
        """
        if not SELENIUM_AVAILABLE:
            self.logger.warning('SELENIUM_NOT_AVAILABLE\t%s', url)
            return ''
        
        driver = None
        try:
            driver = self._get_selenium_driver()
            driver.get(url)
            
            WebDriverWait(driver, timeout).until(
                EC.presence_of_element_located((By.TAG_NAME, 'title'))
            )
            
            time.sleep(2)  # 等待动态内容加载
            
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            title_tag = soup.find('title')
            if title_tag:
                title = title_tag.get_text().strip()
                if title and title not in ['Sina Visitor System', '正在跳转...', 'Redirecting...', 'Please Wait...']:
                    self.logger.info('SELENIUM_TITLE_SUCCESS\t%s\t%s', url, title[:100])
                    return self._ensure_utf8(title)
            
            self.logger.warning('SELENIUM_TITLE_FAILED\t%s', url)
            return ''
            
        except Exception as e:
            self.logger.error('SELENIUM_TITLE_ERROR\t%s\t%s\t%s', url, type(e).__name__, str(e))
            return ''
    
    def fetch_description_with_selenium(self, url, timeout=15):
        """使用 Selenium 获取网站描述
        
        Args:
            url (str): 网站 URL
            timeout (int, optional): 等待超时时间，默认 15 秒
            
       Returns:
           str: 网站描述
        """
        if not SELENIUM_AVAILABLE:
            self.logger.warning('SELENIUM_NOT_AVAILABLE\t%s', url)
            return ''
        
        driver = None
        try:
            driver = self._get_selenium_driver()
            
            if driver.current_url != url:
                driver.get(url)
                WebDriverWait(driver, timeout).until(
                    EC.presence_of_element_located((By.TAG_NAME, 'body'))
                )
                time.sleep(2)
            
            page_source = driver.page_source
            soup = BeautifulSoup(page_source, 'html.parser')
            
            desc_tag = soup.find('meta', attrs={'name': 'description'})
            if not desc_tag:
                desc_tag = soup.find('meta', attrs={'property': 'og:description'})
            
            if desc_tag and 'content' in desc_tag.attrs:
                description = desc_tag['content'].strip()
                self.logger.info('SELENIUM_DESCRIPTION_SUCCESS\t%s\t%s', url, description[:100])
                return self._ensure_utf8(description)
             
            self.logger.warning('SELENIUM_DESCRIPTION_FAILED\t%s', url)
            return ''
            
        except Exception as e:
            self.logger.error('SELENIUM_DESCRIPTION_ERROR\t%s\t%s\t%s', url, type(e).__name__, str(e))
            return ''
    
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
    
    def _ensure_utf8(self, text):
        """确保文本是有效的 UTF-8 编码
        
        Args:
            text (str): 待处理的文本
            
       Returns:
           str: UTF-8 编码的文本
        """
        if isinstance(text, str):
            try:
                encoded = text.encode('utf-8', errors='ignore').decode('utf-8', errors='ignore')
                return encoded
            except:
               return text
        return text
