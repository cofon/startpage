# Edge 浏览器插件快速安装指南

## 🎯 5 分钟快速上手

### 步骤 1：生成图标（如果还没生成）

```bash
cd d:\vue\startpage\extension\icons
python generate_icons.py
```

这会生成三个图标文件：`icon16.png`, `icon48.png`, `icon128.png`

### 步骤 2：打开 Edge 扩展管理

1. 打开 Edge 浏览器
2. 在地址栏输入：`edge://extensions/`
3. 按回车键

或者：
- 点击右上角菜单 (⋯)
- 选择"扩展"
- 点击"管理扩展"

### 步骤 3：启用开发者模式

在扩展管理页面左侧，找到并打开"开发人员"开关（蓝色表示已启用）

### 步骤 4：加载插件

1. 点击"加载解压缩的扩展"按钮
2. 在弹出的文件选择器中，导航到：`d:\vue\startpage\extension`
3. 点击"选择文件夹"确认

### 步骤 5：验证安装

✅ 成功安装的标志：
- 扩展列表中显示 "StartPage - 快速添加网站"
- 版本号为 "1.0.0"
- 状态为"已启用"

### 步骤 6：测试快捷键

1. 打开任意网页（例如：https://www.bing.com）
2. 按下 `Alt + Shift + D`
3. 应该弹出插件窗口

### 步骤 7：测试导入功能

1. 打开插件窗口（点击工具栏图标或使用快捷键）
2. 切换到"导入数据"标签页
3. 点击"选择 JSON 文件"
4. 选择 `sample-data.json` 文件
5. 点击"开始导入"
6. 看到"✓ 成功导入 3 个网站！"提示

### 步骤 8：设置起始页（可选）

如果要将主项目作为起始页：

**方法 A：设置为新标签页**
1. 在扩展商店搜索"New Tab Redirect"
2. 安装后设置 URL 为：`file:///d:/vue/startpage/dist/index.html`

**方法 B：设置为主页**
1. 打开 Edge 设置
2. 进入"开始、主页和新建标签页"
3. 在"主页按钮"中输入：`file:///d:/vue/startpage/dist/index.html`

**方法 C：使用本地服务器（推荐）**
```bash
cd d:\vue\startpage
npm run dev
```
然后在浏览器访问：`http://localhost:5173`

## 🔧 常见问题

### Q: 图标没有显示？
A: 确保已运行 `generate_icons.py` 生成了三个 PNG 文件

### Q: 快捷键没反应？
A: 
- 检查是否与其他软件冲突
- 在 `edge://extensions/shortcuts` 重新设置

### Q: 找不到"加载解压缩的扩展"按钮？
A: 确保已启用"开发人员"开关

### Q: 导入数据失败？
A: 
- 确保 JSON 文件格式正确
- 检查是否包含 `websites` 数组
- 查看控制台错误信息

## 📂 文件结构

```
extension/
├── manifest.json          # 插件配置文件 ✅
├── popup.html            # 弹窗界面 ✅
├── popup.js              # 弹窗逻辑 ✅
├── popup.css             # 弹窗样式 ✅
├── background.js         # 后台服务 ✅
├── icons/
│   ├── icon16.png       # 16x16 图标 ✅
│   ├── icon48.png       # 48x48 图标 ✅
│   ├── icon128.png      # 128x128 图标 ✅
│   └── generate_icons.py # 图标生成脚本 ✅
├── sample-data.json      # 示例数据 ✅
├── README.md            # 详细文档 ✅
└── INSTALL.md           # 本文件 ✅
```

所有标记 ✅ 的文件都已创建完成！

## 🎉 完成！

现在你可以：
- ✨ 使用快捷键快速添加网站
- 📥 从现有项目导入数据
- 📤 导出数据进行备份
- 🔄 与起始页共享数据

祝你使用愉快！🚀
