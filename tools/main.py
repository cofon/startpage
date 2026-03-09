"""
Website Fetcher - 主程序

功能：从起始页导出的 JSON 文件中加载 websites 数据，并补充缺失的 title、description、iconData 字段

使用方法：
    python main.py
    
或者自定义输入输出文件：
    python main.py --input ../src/data/startpage-backup-2026-02-05.json --output websites-updated.json
"""

from website_fetcher import WebsiteFetcher
import sys
import logging
from datetime import datetime


def setup_logger(log_filename='website_fetcher.log'):
    """
    配置日志记录器
    
    Args:
        log_filename (str): 日志文件名
        
    Returns:
        logging.Logger: 配置好的 logger 实例
    """
    # 创建 logger
    logger = logging.getLogger('WebsiteFetcher')
    logger.setLevel(logging.DEBUG)
    
    # 清除已有的 handlers（避免重复）
    logger.handlers.clear()
    
    # 创建 file handler
    file_handler = logging.FileHandler(log_filename, encoding='utf-8')
    file_handler.setLevel(logging.DEBUG)
    
    # 创建 formatter - 使用制表符分隔，便于 awk/sed 处理
    # 格式：时间戳\t级别\t消息
    formatter = logging.Formatter('%(asctime)s\t%(levelname)s\t%(message)s', 
                                  datefmt='%Y-%m-%d %H:%M:%S')
    file_handler.setFormatter(formatter)
    
    # 添加到 logger
    logger.addHandler(file_handler)
    
    return logger


def main():
    """主函数"""
    # 设置日志
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    log_filename = f'website_fetcher_{timestamp}.log'
    logger = setup_logger(log_filename)
    
    # 记录开始信息
    logger.info('=' * 80)
    logger.info('PROGRAM_START\tWebsite Fetcher Started')
    logger.info(f'TIMESTAMP\t{datetime.now().isoformat()}')
    
    print("=" * 60)
    print("Website Fetcher - 网站数据获取工具")
    print("=" * 60)
    print(f"日志文件：{log_filename}")
    
    # 解析命令行参数
    input_file = '../src/data/startpage-backup-2026-02-05.json'  # 默认输入文件
    output_file = 'websites-updated.json'  # 默认输出文件
    max_workers = 5  # 并发线程数
    timeout = 10  # 请求超时时间（秒）
    
    # 简单的命令行参数解析
    args = sys.argv[1:]
    i = 0
    while i < len(args):
        if args[i] == '--input' or args[i] == '-i':
            if i + 1 < len(args):
                input_file = args[i + 1]
                i += 2
            else:
                error_msg = "错误：--input 参数需要指定输入文件路径"
                logger.error(f'PARAM_ERROR\tinput_file_missing\t{error_msg}')
                print(error_msg)
                return
        elif args[i] == '--output' or args[i] == '-o':
            if i + 1 < len(args):
                output_file = args[i + 1]
                i += 2
            else:
                error_msg = "错误：--output 参数需要指定输出文件路径"
                logger.error(f'PARAM_ERROR\toutput_file_missing\t{error_msg}')
                print(error_msg)
                return
        elif args[i] == '--workers' or args[i] == '-w':
            if i + 1 < len(args):
                try:
                    max_workers = int(args[i + 1])
                    i += 2
                except ValueError:
                    error_msg = "错误：--workers 参数需要是整数"
                    logger.error(f'PARAM_ERROR\tworkers_invalid\t{error_msg}')
                    print(error_msg)
                    return
            else:
                error_msg = "错误：--workers 参数需要指定线程数"
                logger.error(f'PARAM_ERROR\tworkers_missing\t{error_msg}')
                print(error_msg)
                return
        elif args[i] == '--timeout' or args[i] == '-t':
            if i + 1 < len(args):
                try:
                    timeout = int(args[i + 1])
                    i += 2
                except ValueError:
                    error_msg = "错误：--timeout 参数需要是整数"
                    logger.error(f'PARAM_ERROR\ttimeout_invalid\t{error_msg}')
                    print(error_msg)
                    return
            else:
                error_msg = "错误：--timeout 参数需要指定超时时间"
                logger.error(f'PARAM_ERROR\ttimeout_missing\t{error_msg}')
                print(error_msg)
                return
        elif args[i] == '--help' or args[i] == '-h':
            print_help()
            return
        else:
            unknown_param = args[i]
            error_msg = f"未知参数：{unknown_param}"
            logger.warning(f'UNKNOWN_PARAM\t{unknown_param}')
            print(error_msg)
            print("使用 --help 查看帮助信息")
            return
    
    # 记录配置信息
    logger.info('CONFIGURATION_START')
    logger.info(f'INPUT_FILE\t{input_file}')
    logger.info(f'OUTPUT_FILE\t{output_file}')
    logger.info(f'MAX_WORKERS\t{max_workers}')
    logger.info(f'TIMEOUT\t{timeout}')
    logger.info('CONFIGURATION_END')
    
    print(f"\n配置信息:")
    print(f"   - 输入文件：{input_file}")
    print(f"   - 输出文件：{output_file}")
    print(f"   - 并发线程数：{max_workers}")
    print(f"   - 请求超时：{timeout}秒")
    
    # 创建 WebsiteFetcher 实例
    fetcher = WebsiteFetcher(max_workers=max_workers, timeout=timeout, logger=logger)
    
    logger.info(f'LOADING_DATA\t{input_file}')
    print(f"\n正在从 '{input_file}' 加载数据...")
    
    # 执行更新操作
    # 自动补充缺失的 title、description、iconData 字段
    updated_websites = fetcher.update_websites_from_export(
        input_file,
        output_filename=output_file
    )
    
    # 统计信息
    if updated_websites:
        total_count = len(updated_websites)
        success_count = sum(1 for w in updated_websites if w.get('title'))
        desc_count = sum(1 for w in updated_websites if w.get('description'))
        icon_count = sum(1 for w in updated_websites if w.get('iconData'))
        
        logger.info('PROCESSING_COMPLETE')
        logger.info(f'TOTAL_WEBSITES\t{total_count}')
        logger.info(f'TITLE_FILLED\t{success_count}')
        logger.info(f'DESCRIPTION_FILLED\t{desc_count}')
        logger.info(f'ICONDATA_FILLED\t{icon_count}')
        logger.info(f'OUTPUT_FILE_SAVED\t{output_file}')
        
        print("\n" + "=" * 60)
        print("✅ 处理完成！")
        print(f"   - 总共处理了 {len(updated_websites)} 个网站")
        print(f"   - 结果已保存到：{output_file}")
        
        # 显示前 5 个网站的简要信息
        print("\n前 5 个网站示例：")
        for i, website in enumerate(updated_websites[:5], 1):
            name = website.get('name', 'N/A')
            url = website.get('url', 'N/A')
            title_status = '✓' if website.get('title') else '✗'
            desc_status = '✓' if website.get('description') else '✗'
            icon_status = '✓' if website.get('iconData') else '✗'
            
            print(f"\n{i}. {name}")
            print(f"   URL: {url}")
            print(f"   Title: {title_status}")
            print(f"   Description: {desc_status}")
            print(f"   IconData: {icon_status}")
    else:
        logger.warning('NO_DATA\tNo websites processed')
        print("\n❌ 没有获取到任何网站数据")
    
    logger.info('PROGRAM_END\tSuccess')
    logger.info('=' * 80)
    print("\n" + "=" * 60)


def print_help():
    """打印帮助信息"""
    help_text = """
Website Fetcher - 使用说明

功能：
  从起始页导出的 JSON 文件中加载 websites 数据，并自动补充缺失的字段：
  - title: 网页标题（从<title>标签获取）
  - description: 网页描述
  - iconData: 网站图标（Base64 Data URI）

基本用法：
  python main.py
  
  默认从 '../src/data/startpage-backup-2026-02-05.json' 加载数据
  结果保存到 'websites-updated.json'

自定义输入输出：
  python main.py --input <输入文件> --output <输出文件>
  
  示例：
  python main.py -i ../src/data/startpage-backup-2026-02-05.json -o output.json

其他参数：
  -w, --workers <数字>     并发线程数（默认：5）
  -t, --timeout <秒数>     请求超时时间（默认：10 秒）
  -h, --help              显示此帮助信息

输出说明：
  ✓ 表示字段已填充
  ✗ 表示字段为空或获取失败
"""
    print(help_text)


if __name__ == '__main__':
    main()
