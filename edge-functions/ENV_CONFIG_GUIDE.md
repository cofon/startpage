# 环境变量配置说明

## 📋 配置方式

### EdgeOne 自动构建（生产环境）

EdgeOne 会自动读取以下配置（优先级从高到低）：

1. **EdgeOne 控制台的环境变量**（最高优先级）
2. **`.env` 文件**（会被提交到 GitHub）
3. **默认值**（如果以上都没有）

---

## 🔧 当前配置

### ✅ 已配置（edge-functions/.env）

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
VITE_LOCAL_API_URL=http://localhost:3000
```

这意味着：
- ✅ **推送到 GitHub 后，EdgeOne 自动构建时会使用 EdgeOne API**
- ✅ 所有元数据请求会发送到 `https://startpage-rjh1mdmj.edgeone.cool/api/get-metadata`
- ✅ 图标会自动转换为 base64 返回

---

## 🚀 推送后的数据获取方式

### 在 EdgeOne 生产环境

```
用户访问页面
    ↓
前端代码执行 fetch('/api/get-metadata')
    ↓
EdgeOne 边缘函数处理请求
    ↓
访问目标网站（如百度）
    ↓
解析 HTML 提取元数据
    ↓
返回 { title, description, iconData }
```

**数据源**: ✅ **EdgeOne 边缘函数**

### 如果有人 clone 代码本地运行

需要手动创建 `.env.local` 文件：

```bash
# 本地开发模式
VITE_API_MODE=local
VITE_LOCAL_API_URL=http://localhost:3000

# 或者使用 EdgeOne API
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

然后启动本地服务：
```bash
npm run serve:local  # 启动本地 API 模拟服务
npm run dev          # 启动前端开发服务器
```

---

## 📊 配置对比

| 场景 | VITE_API_MODE | 数据来源 | 是否需要本地服务 |
|------|--------------|----------|-----------------|
| **EdgeOne 生产** | `edgeone` | EdgeOne 边缘函数 | ❌ 不需要 |
| **本地开发** | `local` | 本地 Node.js 服务 | ✅ 需要运行 `serve:local` |
| **本地开发（直连 EdgeOne）** | `edgeone` | EdgeOne 边缘函数 | ❌ 不需要 |

---

## ⚙️ EdgeOne 控制台配置（可选）

虽然 `.env` 已经包含配置，但你也可以在 EdgeOne 控制台再次确认：

1. 登录 [EdgeOne 控制台](https://console.cloud.tencent.com/edgeone)
2. 选择站点 → 「环境管理」
3. 确认以下变量：

```bash
VITE_API_MODE=edgeone
VITE_EDGEONE_API_URL=https://startpage-rjh1mdmj.edgeone.cool
```

---

## ✅ 验证方法

推送代码后，访问：

```
https://startpage-rjh1mdmj.edgeone.cool/
```

打开浏览器控制台，查看日志：

```javascript
[fetchMetadataFromLocalApi] ========== 开始获取元数据 ==========
[fetchMetadataFromLocalApi] 📍 数据来源：EdgeOne 边缘函数（生产环境）
[fetchMetadataFromLocalApi] API 地址：https://startpage-rjh1mdmj.edgeone.cool
[fetchMetadataFromLocalApi] API 模式：edgeone
```

如果显示 **"EdgeOne 边缘函数（生产环境）"**，说明配置正确！✅

---

## 📝 总结

**回答你的问题**：如果你现在把项目 push 到 GitHub，

✅ **获取数据的方式是：EdgeOne 边缘函数**

具体流程：
1. EdgeOne 检测到 GitHub 推送
2. 自动执行 `npm run build`
3. 使用 `.env` 中的环境变量（`VITE_API_MODE=edgeone`）
4. 前端代码中配置的 API 地址为 `https://startpage-rjh1mdmj.edgeone.cool`
5. 所有元数据请求发送到 EdgeOne 边缘函数
6. 边缘函数返回处理后的数据（包含 base64 图标）

**无需额外配置，直接推送即可！** 🎉
