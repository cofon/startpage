#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""添加知乎调试信息到 website_fetcher.py"""

import re

# 读取文件
with open('website_fetcher.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 要插入的调试代码
debug_code = """            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 调试信息：如果是知乎网站，输出详细数据
            domain = self.extract_domain(normalized_url)
            if 'zhihu.com' in domain:
             self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
             self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
             self.logger.info('DEBUG_ZHIHU_HTML: %s', response.text[:3000])
            
            title = self.fetch_title(soup)"""

# 原始代码
original_code = """            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.fetch_title(soup)"""

# 替换
new_content = content.replace(original_code, debug_code)

# 写回
with open('website_fetcher.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('✅ 已添加知乎调试信息')
print('📝 调试日志前缀：DEBUG_ZHIHU_*')
