# 文档清理建议

## 📅 清理日期
2026-03-18

## 🎯 清理目标
整理 docs 目录，保留有价值的文档，删除过时和重复的内容。

---

## 📊 当前文档分析

### ✅ 建议保留的文档（核心文档）

| 文件名 | 大小 | 说明 | 状态 |
|--------|------|------|------|
| `DOCUMENTATION_INDEX.md` | 3.8KB | 文档索引（新增） | ✅ 保留 |
| `PROJECT_OVERVIEW.md` | 8.4KB | 项目概览（新增） | ✅ 保留 |
| `QUICK_START.md` | 5.7KB | 快速开始（新增） | ✅ 保留 |
| `DOCUMENTATION_UPDATE_SUMMARY.md` | 6.6KB | 更新总结（新增） | ✅ 保留 |

---

### ⚠️ 需要评估的文档

#### 历史版本文档
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `doc-v1.md` | 13.5KB | v1版本文档 | 📦 归档到 history/ |
| `doc-v2.md` | 17.3KB | v2版本文档 | 📦 归档到 history/ |
| `doc-v3.md` | 3.9KB | v3版本文档 | 📦 归档到 history/ |
| `settings_v1.md` | 9.2KB | 旧版设置文档 | 📦 归档到 history/ |

#### 专题文档（可能过时）
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `search.md` | 2.3KB | 搜索功能说明 | 🔍 检查后合并到 README |
| `settings.md` | 5.8KB | 设置功能说明 | 🔍 检查后合并到 README |
| `icon-api.md` | 1.2KB | Icon API 说明 | ⚠️ 可能过时 |
| `icon-solution.md` | 9.5KB | Icon 解决方案 | ⚠️ 可能过时 |

#### 实现计划和重构文档
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `import-data-implementation-plan.md` | 14.7KB | 导入功能实现计划 | ✅ 已完成，可归档 |
| `refactoring-plan.md` | 6.2KB | 重构计划 | ✅ 已完成，可归档 |
| `refactoring-tasks.md` | 3.0KB | 重构任务清单 | ✅ 已完成，可归档 |
| `添加网站重构方案.md` | 33.9KB | 添加网站重构 | ✅ 已完成，可归档 |

#### 通知相关
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `notify-完成情况.md` | 4.3KB | 通知功能完成 | ✅ 已完成，可归档 |
| `notify-通知.md` | 3.8KB | 通知文档 | ⚠️ 检查是否有用 |

#### 数据导出相关
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `edge 收藏夹导出数据.html` | 1.2KB | 测试数据 | 🗑️ 删除 |
| `edge 收藏夹导出数据.json` | 6.3KB | 测试数据 | 🗑️ 删除 |
| `edge 收藏夹导出数据.html` | 260.3KB | 测试数据（大文件） | 🗑️ 删除 |
| `edge 收藏夹导出数据中提取的 url.txt` | 16.0KB | 测试数据 | 🗑️ 删除 |
| `edge 收藏夹导出数据中提取的数据.json` | 260.3KB | 测试数据（大文件） | 🗑️ 删除 |

#### 工具和临时文件
| 文件名 | 大小 | 内容 | 建议 |
|--------|------|------|------|
| `icon-validator-icon 数据检测工具.html` | 7.8KB | 检测工具 | 🔧 可能有用 |
| `vite.config.js.编译单文件无跨域配置.bak` | 0.9KB | 备份文件 | 🗑️ 删除 |
| `settints-theme-list-主题设置面板 - 主题列表 - 主题 item 样式.md` | 0.0KB | 空文件 | 🗑️ 删除 |
| `整理添加和导入网站的函数.txt` | 5.7KB | 笔记 | 📝 个人笔记 |
| `整理添加和导入网站的函数 - 副本.txt` | 5.7KB | 笔记副本 | 🗑️ 删除 |

---

## 🗂️ 建议的目录结构

```
docs/
├── README.md (或 DOCUMENTATION_INDEX.md)  # 文档索引
├── PROJECT_OVERVIEW.md                     # 项目概览
├── QUICK_START.md                          # 快速开始
├── DOCUMENTATION_UPDATE_SUMMARY.md         # 更新记录
│
├── guides/                                 # 使用指南
│   ├── search-guide.md                     # 搜索指南（从 search.md 升级）
│   └── settings-guide.md                   # 设置指南（从 settings.md 升级）
│
├── technical/                              # 技术文档
│   ├── icon-system.md                      # 图标系统（整合 icon-*.md）
│   └── architecture.md                     # 架构文档
│
├── history/                                # 历史文档归档
│   ├── v1-docs/
│   ├── v2-docs/
│   └── refactoring-2026-03/                # 重构相关文档
│
└── tools/                                  # 工具脚本
    └── icon-validator.html                 # 图标检测工具
```

---

## 📋 清理步骤

### 第一阶段：立即清理（安全删除）

```bash
# 1. 删除明显的垃圾文件
rm "docs/vite.config.js.编译单文件无跨域配置.bak"
rm "docs/settints-theme-list-主题设置面板 - 主题列表 - 主题 item 样式.md"
rm "docs/整理添加和导入网站的函数 - 副本.txt"

# 2. 删除测试数据文件
rm "docs/edge 收藏夹导出数据"* 
rm "docs/edge 收藏夹导出数据中提取的"*

# 3. 移动备份文件
mkdir -p docs/history/backups
mv "docs/*.bak" docs/history/backups/ 2>/dev/null || true
```

### 第二阶段：评估和迁移

```bash
# 1. 创建历史文档目录
mkdir -p docs/history/v1
mkdir -p docs/history/v2
mkdir -p docs/history/refactoring-2026-03

# 2. 移动版本文档
mv docs/doc-v1.md docs/history/v1/
mv docs/doc-v2.md docs/history/v2/
mv docs/doc-v3.md docs/history/v2/
mv docs/settings_v1.md docs/history/v1/

# 3. 移动重构相关文档
mv docs/refactoring-plan.md docs/history/refactoring-2026-03/
mv docs/refactoring-tasks.md docs/history/refactoring-2026-03/
mv docs/添加网站重构方案.md docs/history/refactoring-2026-03/
mv docs/import-data-implementation-plan.md docs/history/refactoring-2026-03/

# 4. 移动完成相关的文档
mv docs/notify-完成情况.md docs/history/refactoring-2026-03/
```

### 第三阶段：整合和升级

```bash
# 1. 创建 guides 目录
mkdir -p docs/guides
mkdir -p docs/technical
mkdir -p docs/tools

# 2. 检查和整合 search.md
# 如果内容有价值，升级到 guides/search-guide.md
# 否则移动到 history/

# 3. 检查和整合 settings.md
# 如果内容有价值，升级到 guides/settings-guide.md
# 否则移动到 history/

# 4. 整合 icon 相关文档
mv docs/icon-*.md docs/technical/ 2>/dev/null || true

# 5. 移动工具文件
mv docs/icon-validator-*.html docs/tools/ 2>/dev/null || true
```

---

## 🎯 清理后的预期效果

### 清理前
```
docs/ (26 个文件，杂乱无章)
├── 新旧文档混在一起
├── 测试数据文件
├── 备份文件
├── 临时笔记
└── 难以查找需要的文档
```

### 清理后
```
docs/ (清晰的结构)
├── 核心文档 (4 个)
│   ├── DOCUMENTATION_INDEX.md
│   ├── PROJECT_OVERVIEW.md
│   ├── QUICK_START.md
│   └── DOCUMENTATION_UPDATE_SUMMARY.md
│
├── guides/ (使用指南)
├── technical/ (技术文档)
├── tools/ (工具脚本)
└── history/ (历史归档)
    ├── v1/
    ├── v2/
    └── refactoring-2026-03/
```

---

## 📊 文件统计

### 清理前
- **总文件数**: 26 个
- **总大小**: ~600KB（包含大测试文件）
- **有效文档**: ~10 个
- **垃圾文件**: ~8 个
- **历史文档**: ~8 个

### 清理后（预期）
- **核心文档**: 4 个
- **使用指南**: 2-3 个
- **技术文档**: 3-4 个
- **工具脚本**: 1-2 个
- **历史归档**: 8-10 个
- **总文件数**: ~20 个（更有组织）

---

## ⚡ 快速清理命令

### 一键清理脚本

创建 `cleanup_docs.sh` (Linux/macOS):

```bash
#!/bin/bash

echo "🧹 开始清理 docs 目录..."

# 1. 删除垃圾文件
echo "🗑️  删除垃圾文件..."
rm -f "docs/vite.config.js.编译单文件无跨域配置.bak"
rm -f "docs/settints-theme-list-主题设置面板 - 主题列表 - 主题 item 样式.md"
rm -f "docs/整理添加和导入网站的函数 - 副本.txt"
rm -f "docs/edge 收藏夹导出数据"*
rm -f "docs/edge 收藏夹导出数据中提取的"*

# 2. 创建目录结构
echo "📁 创建目录结构..."
mkdir -p docs/history/v1
mkdir -p docs/history/v2
mkdir -p docs/history/refactoring-2026-03
mkdir -p docs/guides
mkdir -p docs/technical
mkdir -p docs/tools

# 3. 移动历史文档
echo "📦 归档历史文档..."
mv docs/doc-v1.md docs/history/v1/ 2>/dev/null || true
mv docs/doc-v2.md docs/history/v2/ 2>/dev/null || true
mv docs/doc-v3.md docs/history/v2/ 2>/dev/null || true
mv docs/settings_v1.md docs/history/v1/ 2>/dev/null || true

# 4. 移动重构文档
echo "📦 归档重构文档..."
mv docs/refactoring-plan.md docs/history/refactoring-2026-03/ 2>/dev/null || true
mv docs/refactoring-tasks.md docs/history/refactoring-2026-03/ 2>/dev/null || true
mv docs/添加网站重构方案.md docs/history/refactoring-2026-03/ 2>/dev/null || true
mv docs/import-data-implementation-plan.md docs/history/refactoring-2026-03/ 2>/dev/null || true
mv docs/notify-完成情况.md docs/history/refactoring-2026-03/ 2>/dev/null || true

# 5. 移动其他文档
echo "🔄 移动其他文档..."
mv docs/icon-*.md docs/technical/ 2>/dev/null || true
mv docs/icon-validator-*.html docs/tools/ 2>/dev/null || true

echo "✅ 清理完成！"
echo ""
echo "📊 清理结果:"
find docs/ -type f | wc -l
echo "个文件"
```

### Windows PowerShell 版本

创建 `cleanup_docs.ps1`:

```powershell
Write-Host "🧹 开始清理 docs 目录..." -ForegroundColor Green

# 1. 删除垃圾文件
Write-Host "🗑️  删除垃圾文件..." -ForegroundColor Yellow
Remove-Item -Path "docs\vite.config.js.编译单文件无跨域配置.bak" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs\settints-theme-list-主题设置面板 - 主题列表 - 主题 item 样式.md" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs\整理添加和导入网站的函数 - 副本.txt" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs\edge 收藏夹导出数据*" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "docs\edge 收藏夹导出数据中提取的*" -Force -ErrorAction SilentlyContinue

# 2. 创建目录结构
Write-Host "📁 创建目录结构..." -ForegroundColor Cyan
New-Item -ItemType Directory -Path "docs/history/v1" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/history/v2" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/history/refactoring-2026-03" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/guides" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/technical" -Force | Out-Null
New-Item -ItemType Directory -Path "docs/tools" -Force | Out-Null

# 3. 移动历史文档
Write-Host "📦 归档历史文档..." -ForegroundColor Cyan
Move-Item -Path "docs\doc-v1.md" -Destination "docs/history/v1/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\doc-v2.md" -Destination "docs/history/v2/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\doc-v3.md" -Destination "docs/history/v2/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\settings_v1.md" -Destination "docs/history/v1/" -Force -ErrorAction SilentlyContinue

# 4. 移动重构文档
Write-Host "📦 归档重构文档..." -ForegroundColor Cyan
Move-Item -Path "docs\refactoring-plan.md" -Destination "docs/history/refactoring-2026-03/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\refactoring-tasks.md" -Destination "docs/history/refactoring-2026-03/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\添加网站重构方案.md" -Destination "docs/history/refactoring-2026-03/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\import-data-implementation-plan.md" -Destination "docs/history/refactoring-2026-03/" -Force -ErrorAction SilentlyContinue
Move-Item -Path "docs\notify-完成情况.md" -Destination "docs/history/refactoring-2026-03/" -Force -ErrorAction SilentlyContinue

# 5. 移动其他文档
Write-Host "🔄 移动其他文档..." -ForegroundColor Cyan
Get-ChildItem "docs\icon-*.md" -ErrorAction SilentlyContinue | Move-Item -Destination "docs/technical/" -Force
Get-ChildItem "docs\icon-validator-*.html" -ErrorAction SilentlyContinue | Move-Item -Destination "docs/tools/" -Force

Write-Host "✅ 清理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📊 清理结果:" -ForegroundColor Yellow
(Get-ChildItem "docs/" -Recurse -File).Count
Write-Host "个文件"
```

---

## ✅ 清理检查清单

### 安全删除项
- [x] 备份文件（*.bak）
- [x] 空文件（0KB）
- [x] 测试数据文件
- [x] 重复的副本文件
- [ ] 临时笔记（需确认）

### 归档项
- [ ] v1 版本文档
- [ ] v2 版本文档
- [ ] 重构计划文档
- [ ] 实现计划文档
- [ ] 已完成任务文档

### 评估项
- [ ] search.md（是否还有价值）
- [ ] settings.md（是否还有价值）
- [ ] notify 相关文档（是否还有价值）
- [ ] icon 相关文档（是否需要整合）

### 保留项
- [x] 新增的核心文档（4 个）
- [ ] 有用的工具脚本
- [ ] 特殊数据文件

---

## 📝 注意事项

1. **清理前备份**
   ```bash
   cp -r docs/ docs_backup_$(date +%Y%m%d)/
   ```

2. **Git 提交**
   ```bash
   git add docs/
   git commit -m "docs: 清理和重组文档结构"
   ```

3. **通知团队成员**
   - 文档位置变更
   - 新的文档结构
   - 访问方式变化

4. **更新引用**
   - 检查 README.md 中的文档链接
   - 更新代码注释中的文档引用
   - 修复断裂的链接

---

## 🎉 预期收益

### 对用户的益处
- ✅ 更容易找到需要的文档
- ✅ 减少困惑（没有过时信息）
- ✅ 学习路径更清晰

### 对开发者的益处
- ✅ 了解项目历史（通过归档）
- ✅ 参考过往设计决策
- ✅ 避免重复工作

### 对项目的益处
- ✅ 文档质量提升
- ✅ 维护成本降低
- ✅ 专业形象提升

---

**建议执行时间**: 立即  
**预计执行时间**: 10 分钟  
**风险等级**: 低（所有操作可逆）  
**建议执行者**: 项目维护者
