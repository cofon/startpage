# EdgeOne 部署与测试指南

## 🎉 部署信息

### EdgeOne 项目信息
- **部署状态**: ✅ 已部署
- **随机分配域名**: `https://startpage-rjh1mdmj.edgeone.cool/`
- **绑定域名**: 暂未绑定

---

## 🔧 配置步骤

### 方式一：使用 EdgeOne 随机域名（当前）

#### 1. 更新环境变量

编辑 `edge-functions/.env`：

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

#### 2. 重新构建前端

```bash
npm run build
```

#### 3. 部署到 EdgeOne Pages

```bash
cd edge-functions
edgeone pages deploy dist/
```

或者在项目根目录：

```bash
npx edgeone pages deploy dist/ --project-dir edge-functions
```

---

### 方式二：本地开发测试 EdgeOne API

如果想在本地开发时测试 EdgeOne API：

#### 1. 修改 `.env`

```bash
VITE_API_MODE=auto
VITE_LOCAL_API_URL=http://localhost:3000
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

#### 2. 启动开发服务器

```bash
npm run dev
```

此时：
- 开发环境自动使用本地 API（快速调试）
- 生产构建自动使用 EdgeOne API

---

## 🧪 测试验证

### 测试边缘函数 API

访问以下 URL 测试边缘函数是否正常工作：

```
https://startpage-rjh1mdmj.edgeone.cool/api/hello
```

应该返回：
```json
{
  "success": true,
  "data": {
    "message": "Hello from EdgeOne!"
  }
}
```

### 测试元数据获取 API

```
https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata?url=https://www.baidu.com
```

应该返回：
```json
{
  "success": true,
  "data": {
    "title": "百度一下，你就知道",
    "description": "...",
    "iconUrl": "https://www.baidu.com/favicon.ico",
    "iconData": "data:image/x-icon;base64,..."
  }
}
```

---

## 🌐 绑定自定义域名（可选）

如果需要绑定自己的域名：

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 选择对应站点
3. 进入「域名管理」
4. 添加自定义域名
5. 按提示配置 CNAME 记录
6. 等待 DNS 生效

绑定后更新配置：

```bash
VITE_EDGEONE_API_URL=https://your-custom-domain.com
```

---

## 📊 日志查看

在 EdgeOne 控制台可以查看边缘函数的运行日志：

1. 进入 EdgeOne 控制台
2. 选择站点 → 「边缘函数」
3. 点击「日志查询」
4. 查看最近 24 小时的日志

---

## ⚠️ 注意事项

### 1. CORS 跨域问题
如果遇到跨域错误，检查：
- 边缘函数响应头是否包含 `Access-Control-Allow-Origin: *`
- 是否在 `public/_headers` 文件中配置了 CORS

### 2. 网络访问限制
- EdgeOne 在中国大陆地区访问速度较快
- 部分国外网站可能访问受限
- 建议测试国内网站（百度、B 站等）

### 3. 请求次数限制
- EdgeOne 免费额度：300 万次/月
- 单次运行最多 64 次 fetch 请求
- 批量处理时注意分批

### 4. 超时设置
- 默认超时 15 秒
- 可在边缘函数中调整至最长 300 秒
- 建议使用 AbortController 控制超时

---

## 🔄 更新部署流程

### 完整流程

```bash
# 1. 更新边缘函数代码（如需要）
cd edge-functions
# 编辑 api/get-metadata.js

# 2. 更新前端配置
cd ..
# 编辑 .env 文件，设置 VITE_EDGEONE_API_URL

# 3. 构建前端
npm run build

# 4. 部署到 EdgeOne
cd edge-functions
edgeone pages deploy ../dist/
```

### 快速部署（仅前端更新）

```bash
npm run build
npx edgeone pages deploy dist/ --project-dir edge-functions
```

---

## 📝 当前配置

```bash
# edge-functions/.env
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

这意味着：
- ✅ 前端会使用 EdgeOne 边缘函数 API
- ✅ 所有元数据请求会发送到 EdgeOne
- ✅ 图标会自动转换为 base64 返回

---

## ❓ 故障排查

### 问题 1: API 返回 404
**原因**: 路径配置错误或函数未正确注册  
**解决**: 
- 检查 `edgeone-pages.json` 配置
- 确认 `/api/*` 路径映射正确
- 查看部署日志

### 问题 2: CORS 错误
**原因**: 跨域配置缺失  
**解决**:
- 检查边缘函数响应头
- 创建 `public/_headers` 文件

### 问题 3: 获取元数据失败
**原因**: 目标网站反爬或网络问题  
**解决**:
- 查看边缘函数日志
- 测试其他网站
- 检查重试逻辑

### 问题 4: 图标无法显示
**原因**: base64 转换失败或图标过大  
**解决**:
- 检查日志中的 `[Icon]` 相关输出
- 确认图标文件大小（限制 1MB）
- 降级使用 iconUrl

---

## 🎯 下一步

1. ✅ 测试边缘函数基本功能
2. ⏳ 测试元数据获取功能
3. ⏳ 批量测试不同网站的元数据
4. ⏳ 考虑绑定自定义域名
5. ⏳ 监控请求量和性能
