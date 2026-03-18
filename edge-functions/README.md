# EdgeOne 部署指南

## 🚀 快速开始

### 1. 推送代码到 GitHub

```bash
git add .
git commit -m "Deploy to EdgeOne"
git push origin main
```

### 2. EdgeOne 自动构建

EdgeOne 会自动检测 GitHub 推送并执行：
- ✅ `npm install` - 安装依赖
- ✅ `npm run build` - 构建前端
- ✅ 自动部署边缘函数

### 3. 访问你的网站

```
https://startpage-rjh1mdmj.edgeone.cool/
```

---

## ⚙️ 配置说明

### 环境变量（在 EdgeOne 控制台配置）

进入 EdgeOne 控制台 → 站点管理 → 环境管理，添加：

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

### 数据获取方式

所有元数据（title, description, iconData）都从 **EdgeOne 边缘函数** 获取：

```
用户请求 → EdgeOne Pages → 前端页面 → fetch('/api/get-metadata')
                                    ↓
                             EdgeOne 边缘函数
                                    ↓
                          返回 { title, description, iconData }
```

---

## 🔧 项目结构

```
startpage/
├── src/                      # 前端源代码
│   └── services/
│       └── websiteMetadataService.js  # 元数据获取服务（调用 EdgeOne API）
├── edge-functions/           # EdgeOne 边缘函数
│   ├── api/
│   │   ├── get-metadata.js   # 元数据获取函数
│   │   └── hello.js          # Hello World 示例
│   ├── .env                  # 环境变量配置
│   └── edgeone-pages.json    # EdgeOne 配置
├── package.json              # 依赖配置
└── vite.config.js            # Vite 构建配置
```

---

## ✅ 验证清单

推送后依次测试：

1. **前端页面**
   ```
   GET https://startpage-rjh1mdmj.edgeone.cool/
   ```

2. **边缘函数 Hello**
   ```
   GET https://startpage-rjh1mdmj.edgeone.cool/api/hello
   ```

3. **元数据 API**
   ```
   GET https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.baidu.com
   ```

4. **浏览器控制台日志**
   ```javascript
   [fetchMetadata] ========== 开始获取元数据 ==========
   [fetchMetadata] 数据来源：EdgeOne 边缘函数
   [fetchMetadata] ✓ 成功获取元数据
   ```

---

## 📝 注意事项

1. **不要提交 `.env.local` 文件** - 已在 `.gitignore` 中忽略
2. **所有测试使用 EdgeOne API** - 本地开发也直接调用 EdgeOne
3. **图标自动转换为 base64** - 边缘函数已处理
4. **免费额度** - 300 万次请求/月

---

## 🎯 现在可以做什么

✅ **直接推送代码到 GitHub**  
✅ **等待 EdgeOne 自动构建完成**  
✅ **访问分配的域名测试**  

就这么简单！🎉
