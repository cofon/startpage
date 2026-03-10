"""
Website Fetcher - 网站数据获取工具（主协调器）

功能说明：
- 批量获取网站的标题、描述、图标等信息
- 支持多线程并发请求，提高效率
- 自动检测并转换图片格式为 Base64 Data URI
- 为无法获取图标的网站生成 SVG 占位图标
- 支持增量获取和断点续传
- 支持从起始页项目导出的 JSON 文件中加载并更新 websites 数据

模块架构：
- meta_fetcher.py: 负责获取 title 和 description
- icon_fetcher.py: 负责获取 favicon 图标
- file_handler.py: 负责文件读写操作
- website_fetcher.py: 主协调器，集成所有模块

使用示例：

1. 基本用法 - 从 URL 列表获取数据：
    fetcher = WebsiteFetcher(max_workers=5, timeout=10)
    urls = ['https://www.baidu.com', 'https://www.google.com']
    websites = fetcher.batch_fetch(urls)

2. 从起始页导出文件更新数据：
    fetcher = WebsiteFetcher()
   updated_websites = fetcher.update_websites_from_export(
        'startpage-backup-20260309-132958.json',
        output_filename='websites-updated.json'
    )
    
3. 单独加载导出文件：
    fetcher = WebsiteFetcher()
    websites= fetcher.load_startpage_export('startpage-backup-20260309-132958.json')
"""

import logging
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
from datetime import datetime
import urllib3

# 导入子模块
from meta_fetcher import MetaFetcher
from icon_fetcher import IconFetcher
from file_handler import FileHandler

# 禁用 SSL 警告
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)


class WebsiteFetcher:
    """网站数据获取器（主协调器）
    
    主要功能：
    1. 协调 meta_fetcher、icon_fetcher、file_handler 三个模块
    2. 提供统一的公共 API
    3. 实现批量并发获取逻辑
    
    属性：
        max_workers (int): 最大并发线程数
        timeout (int): 请求超时时间（秒）
        meta_fetcher (MetaFetcher): 元数据获取器
        icon_fetcher (IconFetcher): 图标获取器
        file_handler (FileHandler): 文件处理器
        logger (logging.Logger): 日志记录器
    """
    
    def __init__(self, max_workers=5, timeout=10, logger=None):
        """初始化工具类
        
        Args:
            max_workers (int, optional): 最大并发数，默认 5 个线程
            timeout (int, optional): 请求超时时间，默认 10 秒
            logger (logging.Logger, optional): 日志记录器
        """
        self.max_workers = max_workers
        self.timeout = timeout
        
        if logger:
            self.logger = logger
        else:
            self.logger = logging.getLogger('WebsiteFetcher.WebsiteFetcher')
            if not self.logger.handlers:
                handler = logging.StreamHandler()
                handler.setFormatter(logging.Formatter('%(asctime)s\t%(levelname)s\t%(message)s'))
                self.logger.addHandler(handler)
                self.logger.setLevel(logging.INFO)
        
        # 初始化子模块
        self.meta_fetcher = MetaFetcher(timeout=timeout, logger=self.logger)
        self.icon_fetcher = IconFetcher(timeout=timeout, logger=self.logger)
        self.file_handler = FileHandler(logger=self.logger)
    
    def fetch_website_data(self, url):
        """获取单个网站的完整数据
        
        获取内容：
        1. 标准化 URL
        2. 网站标题和描述（通过 meta_fetcher）
        3. 网站图标（通过 icon_fetcher）
        4. 元数据（时间戳、状态等）
        
        Args:
            url(str): 网站 URL
            
        Returns:
            dict: 包含完整网站信息的字典，如果失败则返回 None
        """
        try:
            normalized_url = self.meta_fetcher.normalize_url(url)
            
            # 获取 title 和 description
            meta_info = self.meta_fetcher.fetch_meta(normalized_url)
            if meta_info is None:
               meta_info = {'title': '', 'description': ''}
            
            # 获取图标信息
            icon_info = self.icon_fetcher.fetch_icon(normalized_url)
            
            # 组装完整的网站数据对象
            website_data = {
                'url': normalized_url,
                'name': '',  # 名称字段留空，不使用
                'title': meta_info.get('title', ''),
                'description': meta_info.get('description', ''),
                'iconData': icon_info.get('iconData', ''),
                'iconGenerateData': icon_info.get('iconGenerateData', ''),
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
            error_type = type(e).__name__
            self.logger.error(f'FETCH_ERROR\t{error_type}\t{url}\t{str(e)}')
            print(f"获取 {url} 数据失败：{e}")
        return None
    
    def batch_fetch(self, urls):
        """批量获取网站数据（多线程并发）
        
        使用 ThreadPoolExecutor 实现并发请求
        
        Args:
            urls (list[str]): URL 列表
            
        Returns:
            list[dict]: 成功获取的网站数据列表
        """
        self.logger.info(f'BATCH_FETCH_START\tTOTAL_URLS\t{len(urls)}')
        results = []
        success_count = 0
        failed_urls = []
        processed_count = 0
        
        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            futures= {executor.submit(self.fetch_website_data, url): url for url in urls}
            
            with tqdm(total=len(urls), desc="获取网站数据") as pbar:
                for future in as_completed(futures):
                    url = futures[future]
                    try:
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
                        
                        pbar.update(1)
                        
                    except Exception as e:
                        processed_count += 1
                        pbar.set_postfix({'status': '✗', 'url': url[:30], 'error': type(e).__name__})
                        failed_urls.append(url)
                        self.logger.error(f'TASK_ERROR\t{type(e).__name__}\t{url}\t{str(e)}')
                        
                        pbar.update(1)

        self.logger.info(f'BATCH_FETCH_END\tTOTAL_URLS\t{len(urls)}\tSUCCESS\t{success_count}\tFAILED\t{len(failed_urls)}')
        print(f"\n✅ 成功获取 {success_count}/{len(urls)} 个网站数据")
        if failed_urls:
            print(f"⚠️  失败 {len(failed_urls)} 个网站（已记录到日志）")
        
        # 关闭 Selenium 浏览器实例，释放资源
        self.meta_fetcher.close_selenium_driver()
        
        return results
    
    def load_startpage_export(self, filename):
        """从起始页项目导出的 JSON 文件中加载 websites 数据
        
        Args:
            filename (str): 起始页导出的 JSON 文件名
            
        Returns:
            list[dict]: websites 数组
        """
        return self.file_handler.load_startpage_export(filename)
    
    def load_startpage_export_full(self, filename):
        """从起始页项目导出的 JSON 文件中加载完整数据
        
        Args:
            filename (str): 起始页导出的 JSON 文件名
            
        Returns:
            dict: 完整的导出数据
        """
        return self.file_handler.load_startpage_export_full(filename)
    
    def save_to_json(self, data, filename):
        """保存数据到 JSON 文件
        
        Args:
            data (list[dict]): 网站数据列表
            filename (str): 输出文件名
            
        Returns:
            bool: 是否保存成功
        """
        return self.file_handler.save_to_json(data, filename)
    
    def extract_domain(self, url):
        """从 URL 中提取域名"""
        try:
            from urllib.parse import urlparse
            parsed = urlparse(url)
            domain = parsed.netloc
            # 移除 www. 前缀（如果存在）
            if domain.startswith('www.'):
                domain = domain[4:]
            return domain
        except Exception as e:
            self.logger.warning(f'EXTRACT_DOMAIN_ERROR\t{url}\t{str(e)}')
            return url

    def generate_svg_icon(self, url):
        """为网站生成 SVG 占位图标"""
        try:
            domain = self.extract_domain(url)
            # 使用第一个字母作为图标文本
            first_letter = domain[0].upper() if domain else '?'
            
            svg_template = f'''<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32">
    <rect width="32" height="32" fill="#808080"/>
    <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="16" fill="white" 
          text-anchor="middle" dominant-baseline="central">{first_letter}</text>
</svg>'''
            
            return f"data:image/svg+xml;base64,{self.icon_fetcher.encode_base64(svg_template)}"
        except Exception as e:
            self.logger.error(f'SVG_GENERATION_ERROR\t{url}\t{str(e)}')
            return ''

    def update_websites_from_export(self, input_filename, output_filename=None):
        """从起始页导出文件加载并更新缺失的 title/description/iconData
        
       Args:
           input_filename (str): 输入的导出文件名
           output_filename (str, optional): 输出文件名，不提供则不保存
            
        Returns:
            list[dict]: 更新后的网站数据列表
        """
        self.logger.info('UPDATE_FROM_EXPORT_START\t%s', input_filename)
        
        # 加载导出文件的完整数据（包含 websites、settings 等）
        full_data = self.load_startpage_export_full(input_filename)
        if not full_data or 'websites' not in full_data:
            self.logger.error('UPDATE_FROM_EXPORT_ERROR\tNO_DATA\t%s', input_filename)
            return []
        
        websites = full_data['websites']
        total_count = len(websites)
        self.logger.info('UPDATE_FROM_EXPORT_LOADED\t%d websites', total_count)
        print(f"\n已加载 {total_count} 个网站")
        
        # 统计需要更新的网站数量
        need_update_count = sum(1 for w in websites if not w.get('title') or not w.get('iconData'))
        print(f"发现 {need_update_count} 个网站需要补充数据\n")
        
        # 更新缺失数据的网站
        processed_count = 0
        
        for i, website in enumerate(websites, 1):
            if not website.get('title') or not website.get('iconData'):
                # 需要更新
                url = website.get('url')
                if url:
                    processed_count += 1
                    print(f"[{i}/{total_count}] 正在获取：{url[:60]}...")
                    self.logger.info('UPDATE_WEBSITE\t%s', url)
                    updated_data = self.fetch_website_data(url)
                    if updated_data:
                        # 保留原有数据
                        website.update(updated_data)
                        print(f"         ✓ 成功获取标题：{updated_data.get('title', 'N/A')[:50]}")
                    else:
                        print(f"         ✗ 获取失败")
        
        # 为缺少 iconGenerateData 的网站补充 SVG 图标
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
        print(f"\n为 {svg_generated_count} 个网站生成了 SVG 图标，复用了 {svg_reused_count} 个同域名的 SVG")
        
        # 保存结果（保持完整的 JSON 结构）
        if output_filename:
            self.file_handler.save_startpage_export(full_data, output_filename)
            print(f"结果已保存到：{output_filename}")
        
        success_count = sum(1 for w in websites if w.get('title'))
        icon_count = sum(1 for w in websites if w.get('iconData'))
        
        self.logger.info('UPDATE_FROM_EXPORT_COMPLETE\t%d/%d updated', 
                        len(websites), total_count)
        
        print("\n" + "=" * 60)
        print("处理完成！")
        print(f"   - 总共处理了 {len(websites)} 个网站")
        print(f"   - 成功获取标题：{success_count} 个")
        print(f"   - 成功获取图标：{icon_count} 个")
        print("=" * 60)
        
        return websites