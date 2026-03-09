#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
SVG 图标生成测试脚本

用于验证同一域名的不同 URL 是否使用相同的 SVG 图标
"""

import json
import base64


def test_svg_generation():
    """测试 SVG 生成功能"""
    
    # 读取测试输出文件
    with open('test_domain_output.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    websites = data['websites']
    domain_groups = {}
    
    # 按域名分组
    for website in websites:
        url = website['url']
        # 提取域名
        from urllib.parse import urlparse
        parsed = urlparse(url)
        domain = parsed.netloc
        
        if domain not in domain_groups:
            domain_groups[domain] = []
        
        domain_groups[domain].append({
            'url': url,
            'iconGenerateData': website.get('iconGenerateData', '')
        })
    
    print("=" * 80)
    print("SVG 图标生成测试结果")
    print("=" * 80)
    print()
    
    # 检查每个域名的 SVG 是否一致
    all_passed = True
    for domain, sites in domain_groups.items():
        print(f"域名：{domain}")
        print(f"  网站数量：{len(sites)}")
        
        # 提取所有 SVG（去除 base64 前缀）
        svgs = []
        for site in sites:
            icon_data = site['iconGenerateData']
            if icon_data:
                # 提取 base64 部分
                if ',' in icon_data:
                    base64_part = icon_data.split(',')[1]
                    svgs.append(base64_part)
                    
                    # 解码并显示首字母
                    try:
                        svg_content = base64.b64decode(base64_part).decode('utf-8')
                        # 提取字母
                        if '>B<' in svg_content:
                            letter = 'B'
                        elif '>G<' in svg_content:
                            letter = 'G'
                        elif '>W<' in svg_content:
                            letter = 'W'
                        else:
                            letter = '?'
                        print(f"    - {site['url'][:50]:<50} → 字母：{letter}")
                    except:
                        print(f"    - {site['url'][:50]:<50} → 解析失败")
                else:
                    print(f"    - {site['url'][:50]:<50} → 无 SVG 数据")
                    all_passed = False
            else:
                print(f"    - {site['url'][:50]:<50} → 缺少 iconGenerateData")
                all_passed = False
        
        # 检查同一域名的所有 SVG 是否相同
        if len(svgs) > 1:
            first_svg = svgs[0]
            all_same = all(svg == first_svg for svg in svgs)
            
            if all_same:
                print(f"  ✅ 通过：该域名所有网站使用相同的 SVG")
            else:
                print(f"  ❌ 失败：该域名的不同网站使用了不同的 SVG")
                all_passed = False
        
        print()
    
    print("=" * 80)
    if all_passed:
        print("✅ 所有测试通过！同一域名的网站使用相同的 SVG 图标")
    else:
        print("❌ 测试失败！发现不一致的 SVG 图标")
    print("=" * 80)
    
    return all_passed


if __name__ == '__main__':
    try:
        test_svg_generation()
    except FileNotFoundError:
        print("错误：未找到测试文件 test_domain_output.json")
        print("请先运行：python main.py --input test_domain_svg.json --output test_domain_output.json")
    except Exception as e:
        print(f"测试过程中出错：{e}")
        import traceback
        traceback.print_exc()
