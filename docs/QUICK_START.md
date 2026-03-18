# Startpage 快速开始指南

## 🚀 5 分钟快速上手

### 第一步：安装依赖（1 分钟）

```bash
cd startpage
npm install
```

### 第二步：启动开发服务器（30 秒）

```bash
npm run dev
```

浏览器访问：**http://localhost:5173**

### 第三步：体验核心功能（3 分钟）

#### 1. 添加第一个网站
```
1. 输入框输入：--add
2. 填写 URL：https://www.baidu.com
3. 点击"🌐 获取信息"
4. 点击"添加网站"
```

#### 2. 尝试搜索
```
1. 在搜索框输入：百度
2. 立即显示搜索结果
3. 点击网站访问
```

#### 3. 使用命令
```
输入：--theme
→ 打开主题设置面板

输入：--help
→ 查看帮助信息
```

#### 4. 标记网站
```
1. 鼠标悬浮在网站上
2. 点击⭐标记按钮
3. 网站出现在首页
```

---

## 📦 构建生产版本

```bash
npm run build
```

输出文件：`dist/index.html`

### 使用方式

#### 方式 1：本地双击打开
```bash
# Windows
start dist/index.html

# macOS
open dist/index.html

# Linux
xdg-open dist/index.html
```

⚠️ **注意**: 需要 HTTP 环境才能使用 IndexedDB

#### 方式 2：使用简易 HTTP 服务器

**Python 3**:
```bash
cd dist
python -m http.server 8080
# 访问 http://localhost:8080
```

**Node.js (http-server)**:
```bash
npx http-server dist -p 8080
# 访问 http://localhost:8080
```

---

## 🌐 部署到 EdgeOne（推荐）

### 步骤 1：推送代码到 GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-github-repo>
git push -u origin main
```

### 步骤 2：EdgeOne 自动构建

1. 访问 [EdgeOne 控制台](https://edgeone.ai/console)
2. 创建新项目
3. 连接 GitHub 仓库
4. 自动触发构建

### 步骤 3：配置环境变量

在 EdgeOne 控制台添加：

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://your-domain.edgeone.cool
```

### 步骤 4：访问部署的站点

```
https://your-domain.edgeone.cool
```

✅ **完成！** 全球用户都可以访问了

---

## 💡 常用操作速查

### 添加网站
```
--add → 填写 URL → 获取信息 → 提交
```

### 导出数据
```
--export → 下载 JSON 备份文件
```

### 导入数据
```
--import → 选择 JSON 文件 → 确认导入
```

### 切换主题
```
--theme → 选择主题 → 应用
```

### 设置搜索引擎
```
--search → 选择/添加引擎 → 设为默认
```

### 过滤网站
```
--marked          # 只看已标记
--tag 工作         # 包含"工作"标签
--active false    # 查看已删除
```

### 排序网站
```
--visit    # 按访问次数
--recent   # 按最近访问
```

---

## 🔧 故障排查

### 问题 1：开发服务器启动失败

**症状**: `npm run dev` 报错

**解决方案**:
```bash
# 删除 node_modules 和锁文件
rm -rf node_modules package-lock.json

# 重新安装
npm install

# 重新启动
npm run dev
```

### 问题 2：构建失败

**症状**: `npm run build` 报错

**解决方案**:
```bash
# 检查 Node.js 版本
node -v  # 应该 >=20.19.0

# 升级 Node.js（如需要）
# https://nodejs.org/

# 清理缓存
npm cache clean --force

# 重新构建
npm run build
```

### 问题 3：IndexedDB 无法使用

**症状**: 数据无法保存

**原因**: 必须在 HTTP(S) 环境下运行

**解决方案**:
- ✅ 使用 `npm run dev`（http://localhost:5173）
- ✅ 使用 HTTP 服务器打开 dist
- ❌ 不要直接双击 HTML 文件（file:// 协议不支持）

### 问题 4：EdgeOne 构建失败

**症状**: EdgeOne 控制台显示构建错误

**解决方案**:
```bash
# 本地测试构建
npm run build

# 检查 edge-functions 目录
ls edge-functions/api/

# 测试边缘函数
cd edge-functions
npm run serve:local
curl "http://localhost:3000/api/get-metadata?url=https://www.baidu.com"
```

---

## 📚 下一步学习

完成快速开始后，你可以：

### 1. 深入了解命令模式
阅读 [README.md](../README.md#命令模式)

### 2. 自定义主题和搜索引擎
阅读 [README.md](../README.md#设置功能命令模式访问)

### 3. 批量管理网站
学习导入导出功能

### 4. 部署到生产环境
选择适合的部署方案

### 5. 参与项目开发
查看贡献指南

---

## 🎯 核心命令速记卡

| 命令 | 功能 | 示例 |
|------|------|------|
| `--add` | 添加网站 | `--add` |
| `--export` | 导出数据 | `--export` |
| `--import` | 导入数据 | `--import` |
| `--theme` | 主题设置 | `--theme` |
| `--search` | 搜索设置 | `--search` |
| `--help` | 帮助信息 | `--help` |
| `--marked` | 显示标记 | `--marked` |
| `--tag 名称` | 标签过滤 | `--tag 工作` |
| `--visit` | 访问排序 | `--visit` |
| `--recent` | 时间排序 | `--recent` |

---

## 🆘 获取帮助

### 遇到问题？

1. **查看帮助面板**: 输入 `--help`
2. **阅读文档**: [README.md](../README.md)
3. **提交 Issue**: GitHub Issues
4. **查看示例**: [docs/](./) 目录

### 常见问题

**Q: 数据会同步吗？**  
A: 不会，所有数据存储在本地 IndexedDB。可以定期使用 `--export` 备份。

**Q: 可以离线使用吗？**  
A: 可以，首次加载后完全离线可用（需已添加到书签或 PWA）。

**Q: 支持哪些浏览器？**  
A: 所有现代浏览器（Chrome、Edge、Firefox、Safari）

**Q: 如何迁移数据？**  
A: 在原浏览器 `--export`，在新浏览器 `--import`

---

## ✅ 检查清单

完成后请确认：

- [ ] 成功启动开发服务器
- [ ] 添加了至少 1 个网站
- [ ] 尝试了搜索功能
- [ ] 使用了至少 2 个命令
- [ ] 导出了备份数据
- [ ] 了解了部署方案

🎉 **恭喜你完成了快速开始！**

现在你已经掌握了 Startpage 的基础使用方法，可以开始探索更多高级功能了！

---

**最后更新**: 2026-03-18  
**文档版本**: v2.0.0
