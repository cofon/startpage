# Startpage 文档索引

## 📚 文档导航

### 核心文档

| 文档 | 说明 | 位置 |
|------|------|------|
| **README.md** | 项目主文档，包含完整使用说明 | [查看](../README.md) |
| **PROJECT_OVERVIEW.md** | 项目概览和技术架构 | [查看](./PROJECT_OVERVIEW.md) |
| **QUICK_START.md** | 5 分钟快速上手指南 | [查看](./QUICK_START.md) |

### EdgeOne 相关

| 文档 | 说明 | 位置 |
|------|------|------|
| **README.md** | EdgeOne 边缘函数使用说明 | [查看](../edge-functions/README.md) |
| **ICON_DATA_FIX.md** | IconData 为 null 问题修复记录 | [查看](../edge-functions/ICON_DATA_FIX.md) |
| **ADD_IMPORT_CHECK_REPORT.md** | 添加/导入逻辑检查报告 | [查看](../edge-functions/ADD_IMPORT_CHECK_REPORT.md) |

---

## 🎯 快速查找

### 我想...

#### 快速开始使用
→ 阅读 [QUICK_START.md](./QUICK_START.md)

#### 了解所有命令
→ 阅读 [README.md - 命令模式](../README.md#命令模式)

#### 了解技术架构
→ 阅读 [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md)

#### 部署到生产环境
→ 阅读 [README.md - 部署方案](../README.md#部署方案)

#### 配置 EdgeOne
→ 阅读 [edge-functions/README.md](../edge-functions/README.md)

#### 排查问题
→ 阅读 [QUICK_START.md - 故障排查](./QUICK_START.md#故障排查)

---

## 📖 文档分类

### 入门级
- [QUICK_START.md](./QUICK_START.md) - 新手必读
- [README.md - 使用指南](../README.md#使用指南)

### 进阶级
- [README.md - 命令模式详解](../README.md#命令模式)
- [README.md - 网站管理](../README.md#网站管理)

### 高级级
- [PROJECT_OVERVIEW.md](./PROJECT_OVERVIEW.md) - 技术架构
- [README.md - 数据存储结构](../README.md#数据存储结构)
- [edge-functions/README.md](../edge-functions/README.md) - 边缘函数

### 开发级
- [README.md - 贡献指南](../README.md#贡献指南)
- [README.md - 技术栈](../README.md#技术架构)

---

## 🔧 常用参考

### 命令速查表

```
基础命令:
--theme      --search     --add
--import     --export     --help

过滤命令:
--all        --active     --marked
--hidden     --tag <名称>

排序命令:
--visit      --recent
```

完整列表：[README.md - 命令模式](../README.md#命令模式)

### 数据结构

```javascript
// Website 对象
{
  id: number,
  name: string,
  title: string,
  url: string,
  description: string,
  iconData: string,
  iconGenerateData: string,
  tags: Array,
  isMarked: boolean,
  markOrder: number,
  visitCount: number,
  isActive: boolean,
  isHidden: boolean
}
```

详细说明：[README.md - 数据存储](../README.md#数据存储结构)

### API 端点

```
GET /api/get-metadata?url=<website_url>
```

示例：
```bash
curl "https://your-domain.edgeone.cool/api/get-metadata?url=https://www.baidu.com"
```

详细说明：[README.md - EdgeOne 边缘函数](../README.md#edgeone-边缘函数)

---

## 📝 文档更新记录

### 2026-03-18
- ✅ 重构 README.md（全新版本）
- ✅ 创建 PROJECT_OVERVIEW.md
- ✅ 创建 QUICK_START.md
- ✅ 创建 DOCUMENTATION_INDEX.md（本文档）
- ✅ 清理过时文档

### 历史版本
- 早期版本文档位于 `docs/` 目录
- 部分测试日志已删除

---

## 🤝 贡献文档

欢迎改进文档！

### 如何贡献
1. 发现文档问题
2. 提交 Issue 或直接 PR
3. 保持文档简洁清晰
4. 遵循 Markdown 格式

### 文档规范
- 使用中文撰写
- 代码示例使用 ```bash ``` 或 ```javascript ```
- 表格统一格式
- 添加适当的 emoji 图标

---

## 🆘 需要帮助？

### 文档相关问题
1. 查看本文档索引
2. 搜索关键词
3. 提交 Issue

### 找不到需要的信息？
→ 提交 Issue 说明需求
→ 我们会补充相关文档

---

**最后更新**: 2026-03-18  
**维护者**: Startpage Team  
**文档版本**: v2.0.0
