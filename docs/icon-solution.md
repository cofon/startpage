# 图标管理方案（方案 A 最终完善版）

## 1. 数据库字段设计

### website 表中的 icon 相关字段

```javascript
{
  // ... 其他字段

  // Icon 相关字段
  iconUrl: 'https://github.githubassets.com/favicons/favicon.svg', // 原始 URL
  iconData: 'data:image/[format];base64,...', // 从网络获取的 favicon 转换的 base64 数据（PNG/ICO/JPG等格式）
  iconGenerateData: 'data:image/svg+xml;base64,...', // 本地生成的 SVG 图标
  iconCanFetch: true, // 是否可以从网络获取 icon（布尔值）
  iconFetchAttempts: 0, // 尝试从网络获取的次数（数字）
  iconLastFetchTime: null, // 最后一次尝试从网络获取的时间戳
}
```

## 2. 图标获取流程

```
开始获取 icon
   ↓
1. 检查 iconData
   ├─ 如果存在且有效 → 直接显示 → 结束
   └─ 如果不存在或无效 → 继续
   ↓
2. 检查 iconGenerateData
   ├─ 如果存在且有效 → 显示 → 继续
   └─ 如果不存在或无效 → 继续
   ↓
3. 生成 SVG 图标(如果iconGenerateData有 有效值 跳过这一步)
   ├─ 保存到数据库 website表的iconGenerateData
   ├─ 显示在网页上
   └─ 继续
   ↓
4. 检查是否应该从网络获取
   ├─ 如果 iconCanFetch === false → 结束
   ├─ 如果 iconFetchAttempts >= 5 → 
   │   └─ 设置 iconCanFetch = false
   │   └─ 结束
   └─ 继续
   ↓
5. 从网络获取 icon（仅一次，第一次失败不再尝试，下一次打开网页显示的时候才会再次获取）
   ├─ iconLastFetchTime = 当前时间
   ├─ 如果获取成功
   │   ├─ 转换为 string
   │   ├─ 保存到数据库website表的iconData
   │   ├─ 替换网页上显示的 icon(此时网页上显示的应该是生成的icon，替换成从网络上获取的icon)
   │   └─ 结束
   └─ 如果获取失败
       ├─ iconFetchAttempts++
       └─ 如果 iconFetchAttempts >= 5
           └─ iconCanFetch = false
```
https://faviconsnap.com/api/favicon?url=www.google.com
## 3. 获取icon的API
- FaviconSnap
    - https://faviconsnap.com/api/favicon?url=${domain}
    - 测试网站25个, 成功24个
    - https://faviconsnap.com/zh
    - **优先级最高**
- IconHorse服务
    - https://icon.horse/icon/${domain} 
    - 测试网站25个, 成功24个
    - 限制每月1000 
    - https://icon.horse/
    - 优先级第二(虽然获取成功率高，但是有次数限制)
- faviconPub
    - https://favicon.pub/api/${domain}
    - 测试网站25个, 成功18个
    - https://favicon.pub/cn/favicon-fetcher
- AFMAX图标API
    - https://api.afmax.cn/so/ico/index.php?r=${domain}
    - 测试网站25个, 成功15个
    - https://files.api.afmax.cn/archives/wei-ming-ming-wen-zhang-JVMh2FEN

- **每个API都添加到代码中，第一个获取失败就使用下一个尝试**

## 4. 关键规则

### 4.1 页面级别控制
- **每次页面加载只从网络获取一次**
- 使用页面级别的标记控制
- 避免重复请求

### 4.2 优先级规则
- **iconData 优先级最高**
  - 如果有缓存的 iconData，直接使用
  - 不再尝试从网络获取
- **iconGenerateData 作为后备**
  - 当 iconData 不可用时使用
  - 可以缓存，避免重复生成

### 4.3 网络获取限制
- iconFetchAttempts >= 5 时停止
- iconCanFetch = false 后不再尝试

#### iconFetchAttempts 的具体逻辑

**初始状态**
- iconFetchAttempts = 0（新添加的网站）
- iconCanFetch = true（允许从网络获取）

**重要原则**
iconFetchAttempts 只记录**失败次数**，不记录成功次数

**场景 1：可以获取到 icon**
```
第 1 次访问：获取成功 → iconFetchAttempts = 0（不变）
第 2 次访问：直接使用 iconData → iconFetchAttempts = 0（不变）
第 3 次访问：直接使用 iconData → iconFetchAttempts = 0（不变）
...
```

**场景 2：无法获取 icon**
```
第 1 次访问：获取失败 → iconFetchAttempts = 1
第 2 次访问：获取失败 → iconFetchAttempts = 2
第 3 次访问：获取失败 → iconFetchAttempts = 3
第 4 次访问：获取失败 → iconFetchAttempts = 4
第 5 次访问：获取失败 → iconFetchAttempts = 5 → iconCanFetch = false
第 6 次访问：不再尝试 → 显示生成的图标
```

**场景 3：混合情况（先失败后成功）**
```
第 1 次访问：获取失败 → iconFetchAttempts = 1
第 2 次访问：获取失败 → iconFetchAttempts = 2
第 3 次访问：获取成功 → iconFetchAttempts = 0（获取成功则归零）
  ↓
保存到 iconData
  ↓
第 4 次访问：直接使用 iconData → iconFetchAttempts = 2（不变）
```

**关键点**
1. 只在**失败**时才增加 iconFetchAttempts
2. 成功获取后**不重置** iconFetchAttempts（因为已经保存了 iconData，不会再尝试网络获取）
3. 达到 5 次失败后，设置 iconCanFetch = false，永久停止尝试
4. iconFetchAttempts 用于防止无限重试，避免浪费资源

**错误示例**

❌ 错误：在开始获取时就增加
```javascript
if (iconCanFetch) {
  iconFetchAttempts++  // 这里就错了！
  await fetchIcon()
}
```

✅ 正确：只在失败时增加
```javascript
if (iconCanFetch) {
  try {
    await fetchIcon()
    // 成功：不增加 iconFetchAttempts
  } catch (error) {
    // 失败：才增加 iconFetchAttempts
    iconFetchAttempts++
    if (iconFetchAttempts >= 5) {
      iconCanFetch = false
    }
  }
}
```

### 4.4 错误处理
- 不影响页面显示
- 使用 console.log() 输出友好提示，不使用 console.error()
- 不显示技术细节和错误堆栈

#### 控制台日志处理

**关键点**
- 使用 `console.log()` 而不是 `console.error()`
- 提供友好的提示信息
- 不显示技术细节和错误堆栈

**实现代码**
```javascript
async function fetchIcon(url, websiteName) {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000)

    const response = await fetch(url, {
      signal: controller.signal,
      mode: 'cors'
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      return null
    }

    const blob = await response.blob()
    return await blobToBase64(blob)

  } catch (error) {
    // 使用 console.log 而不是 console.error
    console.log(`${websiteName} icon获取失败，使用自动生成的icon`)
    return null
  }
}
```

**控制台输出示例**
```
Google icon获取失败，使用自动生成的icon
GitHub icon获取失败，使用自动生成的icon
YouTube icon获取失败，使用自动生成的icon
```

**关键区别**
| 类型 | 使用场景 | 控制台显示 |
|------|---------|-----------|
| console.error | ❌ 不使用 | 红色错误 + 堆栈信息 |
| console.log | ✅ 使用 | 普通文本信息 |
PS: 有些错误是浏览器内核错误，无法使用js拦截

## 5. 需要实现的功能模块

### 5.1 IconManager 类
- 管理图标获取逻辑
- 处理缓存
- 处理错误

### 5.2 数据库操作
- 读取 iconData
- 读取 iconGenerateData
- 保存 iconData
- 保存 iconGenerateData
- 更新 iconCanFetch
- 更新 iconFetchAttempts
- 更新 iconLastFetchTime

### 5.3 UI 组件
- WebsiteIcon.vue - 显示图标
  - 处理加载状态
  - 处理错误状态

## 6. 性能考虑

### 6.1 批量更新
- 多个网站的图标更新应该批量处理
- 避免频繁的数据库写入

### 6.2 内存缓存
- 使用 Map 缓存已获取的图标
- 避免重复处理

### 6.3 防抖
- 网络请求添加防抖
- 避免短时间内多次请求

## 7. 实现要点

### 7.1 缓存策略
1. **内存缓存**：使用 Map 存储已获取的图标
2. **页面级别缓存**：使用 Set 记录本次页面加载已尝试获取的网站ID
3. **数据库缓存**：将 iconData 和 iconGenerateData 保存到数据库

### 7.2 错误处理
1. 静默处理错误，不打印到控制台
2. 根据重试次数决定是否继续尝试

### 7.3 网络请求
1. 使用 AbortController 实现超时控制（3秒）
2. 使用 Google Favicon API 获取图标
3. 处理 CORS 问题

### 7.4 图标生成
1. 优先使用网站名称生成首字母图标
2. 如果名称不可用，使用域名生成图标
3. 使用 HSL 颜色空间生成一致的颜色

## 8. 数据流

### 8.1 获取图标流程
```
WebsiteIcon.vue
   ↓
IconManager.getIcon()
   ↓
检查 iconData → 存在 → 返回
   ↓ 不存在
检查 iconGenerateData → 存在 → 返回 → 异步获取网络图标
   ↓ 不存在
生成图标 → 保存到 iconGenerateData → 返回 → 异步获取网络图标
```

### 8.2 网络获取流程
```
IconManager.fetchFromNetwork()
   ↓
检查是否已在进行 → 是 → 返回
   ↓ 否
IconManager.doFetchFromNetwork()
   ↓
从网络获取图标
   ↓ 成功
保存到 iconData → 更新 UI
   ↓ 失败
更新 iconFetchAttempts
   ↓
检查是否达到最大尝试次数 → 是 → 设置 iconCanFetch = false
```

## 9. 注意事项

1. **不要阻塞 UI 渲染**：网络获取应该是异步的，不阻塞主线程
2. **避免重复请求**：使用 Map 和 Set 防止重复请求
3. **合理使用缓存**：充分利用内存缓存和数据库缓存
4. **错误不影响体验**：即使获取失败，也要显示生成的图标
5. **性能优先**：批量更新、防抖、缓存等优化手段

## 10. 版本历史


