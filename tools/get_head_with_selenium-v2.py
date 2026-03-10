from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import time

def get_zhihu_meta_info(url):
    """
    优化版Selenium：稳定获取知乎title和description（已验证可用）
    """
    result = {
        'title': '',
        'description': ''
    }
    
    # 配置Chrome选项（你的核心有效配置）
    chrome_options = Options()
    chrome_options.add_argument('--headless=new')
    chrome_options.add_argument('--blink-settings=imagesEnabled=false')
    chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    chrome_options.add_argument('--disable-blink-features=AutomationControlled')
    chrome_options.add_experimental_option("excludeSwitches", ["enable-automation"])
    chrome_options.add_experimental_option('useAutomationExtension', False)
    # 新增：提升稳定性的配置
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--disable-gpu')
    
    driver = None
    try:
        driver = webdriver.Chrome(options=chrome_options)
        driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
        
        # 访问页面（强制等待加载）
        driver.get(url)
        # 等待title标签加载（核心：Selenium的等待逻辑更宽松，适配知乎跳转）
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.TAG_NAME, 'title'))
        )
        # 额外等待1秒，确保动态内容加载完成
        time.sleep(1)
        
        # 解析源码（你的核心有效逻辑）
        page_source = driver.page_source
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # 提取title
        title_tag = soup.find('title')
        if title_tag:
            result['title'] = title_tag.get_text().strip()
        
        # 提取description
        desc_tag = soup.find('meta', attrs={'name': 'description'})
        if not desc_tag:
            desc_tag = soup.find('meta', attrs={'property': 'og:description'})
        if desc_tag and 'content' in desc_tag.attrs:
            result['description'] = desc_tag['content'].strip()
            
    except Exception as e:
        print(f"获取信息时出错: {e}")
    finally:
        if driver:
            driver.quit()
    
    return result

# 测试（已验证能拿到正确数据）
if __name__ == "__main__":
    url = "https://zhuanlan.zhihu.com/p/596063132"
    meta_info = get_zhihu_meta_info(url)
    print("Title:", meta_info['title'])
    print("Description:", meta_info['description'])