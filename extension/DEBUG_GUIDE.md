# 调试插件重复执行问题

## 问题现象
按 Alt+Shift+D 打开插件面板，在添加网站界面点击保存按钮，网站被添加了两次。

## 调试日志位置

### 1. 主应用（起始页）日志
**查看位置**：起始页标签页的开发者工具控制台（F12）
- 这些日志已经在运行，显示了消息从 Content Script → App.vue 的流程
- 从你提供的日志看，这部分只执行了一次 ✅

### 2. 插件日志（关键！）
**查看位置**：`chrome://extensions/` → StartPage 扩展 → "Service Worker" 链接

#### 步骤：
1. 打开 `chrome://extensions/`
2. 找到 "StartPage - 快速添加网站" 扩展
3. 点击 **"Service Worker"** 或 **"检查视图 - Service Worker"** 链接
4. 会打开一个新的开发者工具窗口
5. 在这个控制台中可以看到 popup.js 和 background.js 的所有日志

## 调试信息说明

### Popup 日志（popup.js）
```
[Popup] ====== 表单提交 #1 开始 ======
[Popup] 当前 isSubmitting: false
[Popup] #1 准备发送 ADD_WEBSITE 消息
[Popup] 网站数据：{...}
[Popup] 调用 chrome.runtime.sendMessage...
[Popup] #1 ✅ 收到响应：{...}
[Popup] 已释放提交锁，isSubmitting = false
[Popup] ====== 表单提交 #1 结束 ======
```

### Background 日志（background.js）
```
[Background] ====== 收到消息 #1 ======
[Background] Action: ADD_WEBSITE
[Background] ⚡ 转发 ADD_WEBSITE 到起始页
[Background] ✅ 发送响应：ADD_WEBSITE 有数据
```

### Content Script 日志（content.js）
```
[Content Script] ====== 收到消息 #1 ======
[Content Script] 🎯 开始处理 ADD_WEBSITE
[Content Script] ✅ 添加成功，ID: 249
[Content Script] 🔓 处理完成，释放锁
```

## 测试步骤

1. **完全卸载并重新加载扩展**
   - 在 `chrome://extensions/` 中移除扩展
   - 重新加载未打包的扩展

2. **清空所有控制台**
   - 起始页控制台（F12）
   - Service Worker 控制台

3. **执行测试**
   - 按 Alt+Shift+D 打开插件面板
   - 填写网站信息
   - **快速连续点击保存按钮 2-3 次**
   - 观察所有控制台的输出

4. **分析日志**
   - 如果看到 `[Popup] 正在提交中，忽略本次请求`，说明防重复机制生效
   - 如果看到多次 `[Popup] ====== 表单提交 #X 开始 ======`，说明提交了多次
   - 对比消息 ID，看是否有重复的消息发送

## 可能的问题根源

根据现有日志分析，可能的原因：

### 假设 1：用户快速点击了两次
**预期日志**：
```
[Popup] ====== 表单提交 #1 开始 ======
[Popup] ====== 表单提交 #2 开始 ======  ← 第二次点击
[Popup] ⚠️ 正在提交中，忽略本次请求    ← 被拦截
```

### 假设 2：消息被转发了两次
**预期日志**：
```
[Background] ====== 收到消息 #1 ======
[Background] ====== 收到消息 #2 ======  ← 收到了两条消息
```

### 假设 3：Content Script 监听了两次
**预期日志**：
```
[Content Script] ====== 收到消息 #1 ======
[Content Script] ====== 收到消息 #2 ======  ← 同一条消息被处理两次
```

## 下一步行动

请按照上述步骤测试，并将 **Service Worker 控制台** 的完整日志发给我，我将帮助你定位问题根源。
