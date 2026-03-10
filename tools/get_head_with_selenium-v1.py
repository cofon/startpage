from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

def get_zhihu_meta_info(url):
    """
    获取知乎专栏文章的 title 和 description 信息
    :param url: 知乎文章URL
    :return: 包含title和description的字典
    """
    # 配置Chrome选项
    chrome_options = Options()
    # 无头模式，不显示浏览器窗口
    chrome_options.add_argument('--headless=new')
    # 禁用图片加载，提高速度
    chrome_options.add_argument('--blink-settings=imagesEnabled=false')
    # 添加请求头，模拟真实浏览器
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    # 禁用浏览器提示
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    
    # 初始化浏览器
    driver = webdriver.Chrome(options=chrome_options)
    # 绕过webdriver检测
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    result = {
        'title': '',
        'description': ''
    }
    
    try:
        # 访问目标URL
        driver.get(url)
        
        # 等待页面加载完成（最多10秒）
        WebDriverWait(driver, 10).until(
            EC.presence_of_element_located((By.TAG_NAME, 'title'))
        )
        
        # 获取页面源代码
        page_source = driver.page_source
        
        # 使用BeautifulSoup解析
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # 提取title
        title_tag = soup.find('title')
        if title_tag:
            result['title'] = title_tag.get_text().strip()
        
        # 提取description（meta标签）
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if not desc_tag:
            desc_tag = soup.find('meta', attrs={'property': 'og:description'})
        if desc_tag and 'content' in desc_tag.attrs:
            result['description'] = desc_tag['content'].strip()
            
    except Exception as e:
        print(f"获取信息时出错: {e}")
    finally:
        # 关闭浏览器
        driver.quit()
    
    return result

# 测试代码
if __name__ == "__main__":
    url = "https://zhuanlan.zhihu.com/p/596063132"
    meta_info = get_zhihu_meta_info(url)
    print("Title:", meta_info['title'])
    print("Description:", meta_info['description'])