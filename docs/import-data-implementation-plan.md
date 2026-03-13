# 起始页导入数据功能实现方案

## 一、整体架构设计

### 1.1 文件结构

```
src/
├── services/
│   └── importService.js          # 新增：导入服务
├── utils/
│   ├── website/
│   │   ├── websiteImportUtils.js # 已有：导入工具函数
│   │   └── websiteUtils.js       # 已有：网站工具函数
│   └── plugin/
│       └── websiteMetadataService.js # 已有：元数据服务
├── components/
│   └── SettingsPanel.vue         # 修改：导入入口
└── composables/
    └── useStartPageAPI.js        # 已有：API接口
```

### 1.2 核心职责划分

**importService.js（新增）**
- 统一的导入入口
- 数据验证和格式判断
- 数据完整性检查
- 批量补全元数据
- 进度管理和错误处理

**SettingsPanel.vue（修改）**
- 文件选择和读取
- 调用 importService
- 显示导入进度
- 显示导入结果

**插件（background.js）**
- 只负责根据 URL 获取 title/description/icon
- 批量处理请求，返回结果

## 二、详细流程设计

### 2.1 完整导入流程

```
用户选择文件
    ↓
读取文件内容
    ↓
JSON 解析
    ↓
验证数据格式
    ↓
判断导入类型
    ├─→ websites 导入
    │      ↓
    │   分离完整/不完整数据
    │      ↓
    │   批量补全不完整数据
    │      ↓
    │   标准化所有数据
    │      ↓
    │   批量导入数据库
    │      ↓
    │   返回结果统计
    │
    └─→ urls 导入
           ↓
        批量获取元数据
           ↓
        补全其他字段
           ↓
        标准化数据
           ↓
        批量导入数据库
           ↓
        返回结果统计
```

### 2.2 数据验证流程

```
解析 JSON
    ↓
验证基本格式（是否为对象）
    ↓
验证必填字段（至少有 websites 或 urls）
    ↓
验证数据类型（websites 是数组，urls 是数组）
    ↓
验证 URL 格式（每个 URL 必须有效）
    ↓
验证网站数据（至少有 URL）
```

## 三、核心函数设计

### 3.1 importService.js 主要函数

```javascript
/**
 * 导入数据的主入口
 * @param {Object} jsonData - 解析后的 JSON 数据
 * @param {Object} options - 配置选项
 * @param {Function} progressCallback - 进度回调
 * @returns {Promise<Object>} 导入结果
 */
async function importData(jsonData, options, progressCallback)

/**
 * 验证导入数据格式
 * @param {Object} data - JSON 数据
 * @returns {Object} { valid: boolean, type: string, errors: string[] }
 */
function validateImportData(data)

/**
 * 判断导入类型
 * @param {Object} data - JSON 数据
 * @returns {string} 'websites' | 'urls' | 'unknown'
 */
function getImportType(data)

/**
 * 检查网站数据完整性
 * @param {Object} website - 网站数据
 * @returns {boolean} 是否完整
 */
function isWebsiteComplete(website)

/**
 * 分离完整和不完整的网站
 * @param {Array} websites - 网站数组
 * @returns {Object} { complete: [], incomplete: [] }
 */
function separateWebsites(websites)

/**
 * 批量补全网站元数据
 * @param {Array} websites - 需要补全的网站数组
 * @param {Function} progressCallback - 进度回调
 * @returns {Promise<Array>} 补全后的网站数组
 */
async function enrichWebsites(websiteUrls, progressCallback)

/**
 * 标准化网站数据
 * @param {Array} websites - 网站数组
 * @returns {Array} 标准化后的网站数组
 */
function normalizeWebsites(websites)

/**
 * 批量导入网站到数据库
 * @param {Array} websites - 网站数组
 * @returns {Promise<Object>} 导入结果
 */
async function importWebsitesToDB(websites)
```

## 四、意外情况及处理方案

### 4.1 文件读取相关

**情况1：用户选择了非 JSON 文件**
- 检测方法：文件扩展名不是 .json
- 处理方案：
  - 立即提示用户"请选择 JSON 格式的文件"
  - 不执行后续操作
  - 清空文件输入框

**情况2：JSON 文件过大（>10MB）**
- 检测方法：检查文件大小
- 处理方案：
  - 提示用户"文件过大，建议分批导入"
  - 提供选项：继续导入或取消
  - 如果继续，显示加载进度

**情况3：JSON 解析失败**
- 检测方法：JSON.parse() 抛出异常
- 处理方案：
  - 提示用户"文件格式错误，不是有效的 JSON"
  - 显示详细的错误信息（JSON 语法错误位置）
  - 建议用户检查文件格式

### 4.2 数据格式相关

**情况4：JSON 数据不是对象**
- 检测方法：typeof data !== 'object'
- 处理方案：
  - 提示用户"数据格式错误：根节点必须是对象"
  - 显示实际的数据类型
  - 提供正确的格式示例

**情况5：缺少必填字段**
- 检测方法：同时没有 websites 和 urls 字段
- 处理方案：
  - 提示用户"数据格式错误：必须包含 websites 或 urls 字段"
  - 显示正确的格式示例
  - 提供格式说明文档链接

**情况6：websites 不是数组**
- 检测方法：typeof data.websites !== 'array'
- 处理方案：
  - 提示用户"数据格式错误：websites 必须是数组"
  - 显示实际的数据类型
  - 提供正确的格式示例

**情况7：urls 不是数组**
- 检测方法：typeof data.urls !== 'array'
- 处理方案：
  - 提示用户"数据格式错误：urls 必须是数组"
  - 显示实际的数据类型
  - 提供正确的格式示例

### 4.3 URL 相关

**情况8：URL 格式无效**
- 检测方法：使用 isValidUrl() 验证失败
- 处理方案：
  - 记录无效 URL 列表
  - 跳过无效 URL，继续处理其他数据
  - 导入完成后显示"跳过了 X 个无效 URL"
  - 提供查看无效 URL 列表的功能

**情况9：URL 为空字符串**
- 检测方法：url.trim() === ''
- 处理方案：
  - 跳过该条数据
  - 记录到无效数据列表
  - 在结果中显示"跳过了 X 个空 URL"

**情况10：URL 重复**
- 检测方法：在导入前检查数据库中是否已存在
- 处理方案：
  - 提供选项：
    - 跳过重复的 URL（默认）
    - 更新已存在的网站数据
  - 显示重复 URL 数量
  - 记录重复 URL 列表

### 4.4 网站数据相关

**情况11：网站数据缺少必填字段**
- 检测方法：validateWebsite() 返回 false
- 处理方案：
  - 记录无效网站数据
  - 跳过该条数据
  - 在结果中显示"跳过了 X 个无效网站"
  - 提供查看无效数据详情

**情况12：网站数据不完整（缺少 title/description）**
- 检测方法：isWebsiteComplete() 返回 false
- 处理方案：
  - 标记为需要补全
  - 发送给插件批量处理
  - 如果补全失败，使用默认值：
    - title: 从 URL 提取域名
    - description: '暂无描述'
    - icon: 自动生成 SVG

**情况13：网站数据包含未知字段**
- 检测方法：字段不在预定义的字段列表中
- 处理方案：
  - 忽略未知字段
  - 记录警告日志
  - 不影响导入流程

### 4.5 插件通信相关

**情况14：插件未安装或未启用**
- 检测方法：chrome.runtime.sendMessage 抛出异常
- 处理方案：
  - 提示用户"插件未安装，无法自动补全数据"
  - 提供选项：
    - 继续导入（使用默认值）
    - 取消导入
  - 如果继续，使用默认值补全数据

**情况15：插件响应超时**
- 检测方法：请求超过 10 秒没有响应
- 处理方案：
  - 记录超时的 URL
  - 使用默认值补全数据
  - 在结果中显示"X 个网站获取元数据超时"
  - 提供重试按钮

**情况16：插件返回数据格式错误**
- 检测方法：返回数据不符合预期格式
- 处理方案：
  - 记录错误详情
  - 使用默认值补全数据
  - 在结果中显示"X 个网站元数据格式错误"
  - 不影响其他网站的导入

**情况17：插件返回部分数据**
- 检测方法：某些字段缺失（如只有 title，没有 description）
- 处理方案：
  - 使用返回的有效字段
  - 缺失的字段使用默认值
  - 记录部分成功的网站
  - 在结果中显示"X 个网站部分数据补全成功"

### 4.6 数据库操作相关

**情况18：数据库未初始化**
- 检测方法：db 对象不存在或未初始化
- 处理方案：
  - 提示用户"数据库未初始化"
  - 尝试初始化数据库
  - 如果失败，取消导入
  - 提示用户刷新页面重试

**情况19：数据库写入失败**
- 检测方法：数据库操作抛出异常
- 处理方案：
  - 记录失败的网站数据
  - 继续处理其他网站
  - 在结果中显示"X 个网站导入失败"
  - 提供重试失败数据的功能

**情况20：导入过程中数据库连接断开**
- 检测方法：数据库事务失败
- 处理方案：
  - 停止导入
  - 记录已导入的网站数量
  - 提示用户"导入中断，已导入 X 个网站"
  - 提供选项：
    - 重新导入全部数据
    - 从中断处继续导入

### 4.7 性能相关

**情况21：批量导入数据量过大（>1000个网站）**
- 检测方法：websites.length > 1000
- 处理方案：
  - 提示用户"数据量较大，导入可能需要较长时间"
  - 提供选项：
    - 继续导入（显示详细进度）
    - 取消导入
  - 如果继续，分批处理（每批100个）
  - 显示当前进度（已处理 X / 总数 Y）

**情况22：插件批量请求过多**
- 检测方法：不完整网站数量 > 50
- 处理方案：
  - 分批发送请求（每批 20 个）
  - 每批之间间隔 100ms
  - 避免插件过载

**情况23：内存占用过高**
- 检测方法：浏览器性能监控
- 处理方案：
  - 分批处理数据
  - 及时释放已处理的数据
  - 显示内存使用警告

### 4.8 用户体验相关

**情况24：用户取消导入**
- 检测方法：用户点击取消按钮
- 处理方案：
  - 停止当前操作
  - 清理临时数据
  - 提示"导入已取消"
  - 不保存任何已导入的数据（或询问是否保存已导入部分）

**情况25：导入过程中页面刷新**
- 检测方法：beforeunload 事件
- 处理方案：
  - 提示用户"导入正在进行，确定要离开吗？"
  - 如果用户确认离开，清理临时数据
  - 记录中断状态，下次打开时提示继续

**情况26：导入结果展示**
- 处理方案：
  - 显示详细的导入结果：
    - 成功导入数量
    - 跳过数量（无效数据）
    - 失败数量（错误数据）
    - 更新数量（已存在）
  - 提供查看详情的功能：
    - 查看成功导入的网站
    - 查看跳过的数据及原因
    - 查看失败的数据及错误信息
  - 提供操作选项：
    - 重新导入失败的数据
    - 导出失败的数据列表
    - 关闭结果面板

## 五、进度反馈设计

### 5.1 进度显示

```
正在导入数据...
进度：[████████░░] 80% (80/100)
已完成：80 个网站
处理中：20 个网站
```

### 5.2 详细状态

```
当前状态：正在获取网站元数据...
正在处理：https://www.example.com
```

### 5.3 结果统计

```
导入完成！
✓ 成功导入：80 个网站
⚠ 跳过数据：10 个（格式无效）
❌ 导入失败：5 个（网络错误）
🔄 更新数据：5 个（已存在）
```

## 六、错误处理策略

### 6.1 错误分类

1. **致命错误**：必须停止导入
   - JSON 解析失败
   - 数据库未初始化
   - 插件未安装且用户选择不继续

2. **可恢复错误**：跳过当前项，继续处理
   - 单个网站数据无效
   - 单个 URL 无效
   - 单个网站补全失败

3. **警告**：不影响导入，但需要记录
   - 未知字段
   - 部分数据补全成功
   - 数据不完整但可补全

### 6.2 错误日志

```javascript
{
  timestamp: '2024-03-13T10:30:00Z',
  type: 'error' | 'warning' | 'info',
  message: '错误描述',
  data: {
    url: 'https://example.com',
    website: {...},
    error: {...}
  }
}
```

## 七、配置选项

```javascript
{
  // 导入模式
  mode: 'websites' | 'urls' | 'auto',  // auto 自动检测

  // 重复数据处理
  onDuplicate: 'skip' | 'update' | 'ask',  // ask 询问用户

  // 不完整数据处理
  onIncomplete: 'enrich' | 'skip' | 'use-default',

  // 批量大小
  batchSize: 20,  // 每批处理数量

  // 超时设置
  timeout: 10000,  // 插件响应超时时间（毫秒）

  // 进度回调
  onProgress: (progress) => {},

  // 完成回调
  onComplete: (result) => {}
}
```

## 八、任务计划

### 第一阶段：基础架构搭建

#### 任务1：创建 importService.js 文件
- 创建 `src/services/importService.js` 文件
- 定义基本的文件结构和导出
- 添加必要的注释和文档

#### 任务2：实现数据验证函数
- 实现 `validateImportData()` 函数
- 实现 `getImportType()` 函数
- 实现 `isWebsiteComplete()` 函数
- 添加单元测试

#### 任务3：实现数据分离函数
- 实现 `separateWebsites()` 函数
- 实现 `normalizeWebsites()` 函数
- 添加单元测试

### 第二阶段：核心功能实现

#### 任务4：实现批量补全功能
- 实现 `enrichWebsites()` 函数
- 处理插件通信
- 实现分批请求逻辑
- 添加错误处理

#### 任务5：实现数据库导入功能
- 实现 `importWebsitesToDB()` 函数
- 处理重复数据
- 添加事务支持
- 添加错误处理

#### 任务6：实现主导入函数
- 实现 `importData()` 主函数
- 整合所有子功能
- 实现进度回调
- 添加错误处理

### 第三阶段：UI 集成

#### 任务7：修改 SettingsPanel.vue - 文件读取
- 修改 `handleImport()` 函数
- 添加文件大小检查
- 添加文件类型验证
- 添加 JSON 解析错误处理

#### 任务8：修改 SettingsPanel.vue - 进度显示
- 添加进度显示组件
- 实现进度更新逻辑
- 添加取消按钮
- 添加当前状态显示

#### 任务9：修改 SettingsPanel.vue - 结果展示
- 添加结果统计组件
- 实现详细结果展示
- 添加重试功能
- 添加导出失败数据功能

### 第四阶段：错误处理和优化

#### 任务10：实现错误处理机制
- 实现错误分类
- 实现错误日志记录
- 实现错误恢复策略
- 添加用户友好的错误提示

#### 任务11：性能优化
- 实现分批处理
- 优化内存使用
- 添加性能监控
- 优化插件通信

#### 任务12：测试和修复
- 完整功能测试
- 边界情况测试
- 性能测试
- 修复发现的问题
