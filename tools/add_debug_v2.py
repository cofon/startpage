#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""添加知乎调试信息到 website_fetcher.py - v2 版本"""

# 读取文件
with open('website_fetcher.py', 'r', encoding='utf-8') as f:
    content = f.read()

# 恢复原始代码（移除之前的调试）
original_with_debug = """            soup = BeautifulSoup(response.text, 'html.parser')
            
            # 调试信息：如果是知乎网站，输出详细数据
            domain = self.extract_domain(normalized_url)
            if 'zhihu.com' in domain:
            self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
            self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
            self.logger.info('DEBUG_ZHIHU_HTML: %s', response.text[:3000])
            
            title = self.fetch_title(soup)"""

original_code = """            soup = BeautifulSoup(response.text, 'html.parser')
            
            title = self.fetch_title(soup)"""

content = content.replace(original_with_debug, original_code)

# 新的调试代码（放在 get 之后，raise_for_status 之前）
debug_code = """            # 发送 HTTP 请求获取网页内容
            # verify=False 禁用 SSL 证书验证（仅开发环境使用）
            # timeout=(connect_timeout, read_timeout) 分别设置连接和读取超时
            response = self.session.get(
                normalized_url, 
                timeout=(5, 15),  # 连接超时 5 秒，读取超时 15 秒
                verify=False
            )
            
            # 调试信息：如果是知乎网站，输出详细数据（在检查状态码之前）
            domain = self.extract_domain(normalized_url)
            if 'zhihu.com' in domain:
             self.logger.info('DEBUG_ZHIHU_URL: %s', normalized_url)
             self.logger.info('DEBUG_ZHIHU_STATUS: %s', response.status_code)
             self.logger.info('DEBUG_ZHIHU_HEADERS: %s', dict(response.headers))
             self.logger.info('DEBUG_ZHIHU_HTML_LENGTH: %d', len(response.text))
             self.logger.info('DEBUG_ZHIHU_HTML_PREVIEW: %s', response.text[:2000])
            
            response.raise_for_status()  # 如果状态码不是 200，抛出异常"""

original_get_code = """            # 发送 HTTP 请求获取网页内容
            # verify=False 禁用 SSL 证书验证（仅开发环境使用）
            # timeout=(connect_timeout, read_timeout) 分别设置连接和读取超时
            response = self.session.get(
                normalized_url, 
                timeout=(5, 15),  # 连接超时 5 秒，读取超时 15 秒
                verify=False
            )
            response.raise_for_status()  # 如果状态码不是 200，抛出异常"""

# 替换
new_content = content.replace(original_get_code, debug_code)

# 写回
with open('website_fetcher.py', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('✅ 已更新知乎调试信息（在 raise_for_status 之前）')
print('📝 现在即使 403 错误也会输出调试数据')
