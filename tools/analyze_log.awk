#!/usr/bin/awk -f
# analyze_log.awk - Website Fetcher 日志分析脚本
# 使用方法：awk -f analyze_log.awk website_fetcher_*.log

BEGIN {
    FS = "\t"
    print "=== Website Fetcher 日志分析报告 ==="
    print ""
}

# 程序开始时间
/PROGRAM_START/ {
    program_start = $1
}

# 程序结束时间
/PROGRAM_END/ {
    program_end = $1
}

# 配置信息
/INPUT_FILE/ {
    input_file = $3
}

/OUTPUT_FILE/ {
    output_file = $3
}

/MAX_WORKERS/ {
    max_workers = $3
}

/TIMEOUT/ {
    timeout = $3
}

# 数据统计
/TOTAL_WEBSITES/ {
    total_websites = $3
}

/MISSING_FIELDS_STATISTICS/ {
    missing_title = $3
    missing_desc = $5
    missing_icon = $7
}

/URLS_TO_FETCH/ {
    urls_to_fetch = $3
}

/SUCCESS.*FAILED/ {
    # 匹配 BATCH_FETCH_END 行
    if ($3 == "TOTAL_URLS") {
        fetch_total = $4
        fetch_success = $6
        fetch_failed = $8
    }
}

/UPDATED_COUNT/ {
    updated_count = $3
}

/TITLE_FILLED/ {
    title_filled = $3
}

/DESCRIPTION_FILLED/ {
    desc_filled = $3
}

/ICONDATA_FILLED/ {
    icon_filled = $3
}

# 错误统计
$2 == "ERROR" {
    error_count++
    errors[error_count] = $3 "\t" $4
}

# 警告统计
$2 == "WARNING" {
    warning_count++
}

END {
    print "【执行时间】"
    print "  开始：" program_start
    print "  结束：" program_end
    print ""
    
    print "【配置信息】"
    print "  输入文件：" input_file
    print "  输出文件：" output_file
    print "  并发线程：" max_workers
    print "  超时时间：" timeout "秒"
    print ""
    
    print "【处理统计】"
    print "  总网站数：" total_websites
    print "  缺失统计：title=" missing_title ", description=" missing_desc ", iconData=" missing_icon
    print "  需要获取：" urls_to_fetch
    print ""
    
    print "【获取结果】"
    print "  总共尝试：" fetch_total
    print "  成功：" fetch_success
    print "  失败：" fetch_failed
    if (fetch_total > 0) {
        success_rate = (fetch_success / fetch_total) * 100
        printf "  成功率：%.2f%%\n", success_rate
    }
    print ""
    
    print "【更新结果】"
    print "  更新数量：" updated_count
    print "  Title 填充：" title_filled
    print "  Description 填充：" desc_filled
    print "  IconData 填充：" icon_filled
    print ""
    
    print "【错误统计】"
    print "  错误总数：" error_count
    print "  警告总数：" warning_count
    if (error_count > 0) {
        print ""
        print "  错误详情:"
        for (i = 1; i <= error_count; i++) {
            print "    " i ". " errors[i]
        }
    }
    print ""
    
    print "==============================="
}
