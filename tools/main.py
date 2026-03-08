"""
Website Fetcher - 主程序
"""

from website_fetcher import WebsiteFetcher
import json
import sys


def load_urls_from_file(filename='urls.txt'):
    """
    从文件加载URL列表

    Args:
        filename: 文件名

    Returns:
        URL列表
    """
    try:
        with open(filename, 'r', encoding='utf-8') as f:
            urls = [line.strip() for line in f if line.strip()]
        return urls
    except FileNotFoundError:
        print(f"错误: 找不到文件 {filename}")
        return []


def main():
    """主函数"""
    print("Website Fetcher - 网站数据获取工具")
    print("=" * 50)

    # 加载URL列表
    urls = load_urls_from_file()
    if not urls:
        print("错误: 没有找到URL")
        print("请在 urls.txt 文件中添加URL，每行一个")
        return

    print(f"找到 {len(urls)} 个URL")

    # 创建获取器
    fetcher = WebsiteFetcher(max_workers=5, timeout=10)

    # 加载已有数据
    existing_data = fetcher.load_existing_data()

    # 增量获取数据
    results = fetcher.batch_fetch_incremental(urls, existing_data)

    if not results:
        print("没有获取到新数据")
        return

    # 合并已有数据和新数据
    all_data = list(existing_data.values()) + results

    # 保存数据
    with open('websites.json', 'w', encoding='utf-8') as f:
        # 直接保存为正确的导入格式
        import_data = {
            'websites': all_data
        }
        json.dump(import_data, f, ensure_ascii=False, indent=2)

    print(f"完成！成功获取 {len(results)} 个网站的数据")
    print(f"总共 {len(all_data)} 个网站")
    print("数据已保存到 websites.json")


if __name__ == '__main__':
    main()
