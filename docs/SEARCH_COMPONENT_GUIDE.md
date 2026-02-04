# 搜索框组件实现指南

本文档描述了一个带有搜索引擎选择功能的搜索框组件的实现方式，该组件具有以下特点：
- 圆角搜索框设计
- 左侧显示搜索引擎图标
- 点击图标可展开/收起搜索引擎列表
- 列表展开时以平滑动画方式显示，并逐步挤压输入框空间
- 选择搜索引擎后列表自动收起

## 组件结构

### HTML 结构

```html
<div class="search-container">
  <div class="search-box">
    <div class="engine-icon-container" @click="toggleEngineList">
      <div class="engine-icon">{{ selectedEngine.icon }}</div>
      <transition-group name="slide">
        <div 
          v-for="(engine, index) in showEngineList ? searchEngines : []" 
          :key="engine.id" 
          class="engine-item"
          :class="{ 'selected': engine.id === selectedEngine.id }"
          :style="{ transitionDelay: `${index * 0.05}s` }"
          @click.stop="selectEngine(engine)"
        >
          {{ engine.icon }}
        </div>
      </transition-group>
    </div>
    <input 
      v-model="searchText" 
      type="text" 
      class="search-input" 
      placeholder="Search..."
    />
  </div>
</div>
```

### 数据结构

```javascript
// 搜索引擎列表
const searchEngines = [
  { id: 'google', name: 'Google', icon: '🔍' },
  { id: 'bing', name: 'Bing', icon: '🔎' },
  { id: 'baidu', name: 'Baidu', icon: '🌐' },
  { id: 'duckduckgo', name: 'DuckDuckGo', icon: '🦆' }
]

// 当前选中的搜索引擎
const selectedEngine = ref(searchEngines[0])

// 是否显示搜索引擎列表
const showEngineList = ref(false)

// 搜索框输入内容
const searchText = ref('')

// 切换搜索引擎列表显示状态
const toggleEngineList = () => {
  showEngineList.value = !showEngineList.value
}

// 选择搜索引擎
const selectEngine = (engine) => {
  selectedEngine.value = engine
  showEngineList.value = false
}
```

## 样式规范

### 整体布局

- **search-container**: 
  - 使用 flex 布局，居中显示搜索框
  - 高度为 100vh
  - 背景为渐变色：`linear-gradient(135deg, #667eea 0%, #764ba2 100%)`

### 搜索框样式

- **search-box**:
  - 宽度：700px
  - 高度：60px
  - 背景色：白色
  - 圆角：30px
  - 阴影：`0 10px 30px rgba(0, 0, 0, 0.2)`
  - hover 时阴影加深：`0 15px 40px rgba(0, 0, 0, 0.25)`

### 图标区域样式

- **engine-icon-container**:
  - 使用 flex 布局，垂直居中
  - 高度：100%
  - 过渡效果：`transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)`

- **engine-icon**:
  - 宽度：50px
  - 高度：100%
  - 字体大小：24px
  - 颜色：#667eea
  - hover 时颜色变为：#764ba2
  - 左侧内边距：8px

- **engine-item**:
  - 宽度：50px
  - 高度：100%
  - 字体大小：24px
  - 颜色：#667eea
  - hover 时背景色：#f8f9ff，颜色：#764ba2
  - 选中状态背景色：#f0f4ff，颜色：#764ba2

### 输入框样式

- **search-input**:
  - 使用 flex: 1 占据剩余空间
  - 高度：100%
  - 内边距：0 24px
  - 字体大小：18px
  - 文字颜色：#333
  - placeholder 颜色：#aaa

### 动画效果

- **transition-group 动画**:
  - 过渡时间：0.4s
  - 缓动函数：`cubic-bezier(0.25, 0.8, 0.25, 1)`
  - 进入/离开时的状态：
    - 宽度：0
    - 透明度：0
    - 位移：`translateX(-10px)`
  - 进入/离开后的状态：
    - 宽度：50px
    - 透明度：1
    - 位移：`translateX(0)`
  - 每个图标项有延迟：`transitionDelay: ${index * 0.05}s`

- **slide-move**:
  - 过渡时间：0.4s
  - 缓动函数：`cubic-bezier(0.25, 0.8, 0.25, 1)`

## 完整样式代码

```css
.search-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.search-box {
  display: flex;
  align-items: center;
  width: 700px;
  height: 60px;
  background-color: white;
  border-radius: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
  overflow: hidden;
  transition: box-shadow 0.3s ease;
}

.search-box:hover {
  box-shadow: 0 15px 40px rgba(0, 0, 0, 0.25);
}

.engine-icon-container {
  display: flex;
  align-items: center;
  height: 100%;
  transition: width 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.engine-icon {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 100%;
  font-size: 24px;
  cursor: pointer;
  flex-shrink: 0;
  color: #667eea;
  transition: color 0.3s ease;
  padding-left: 8px;
}

.engine-icon:hover {
  color: #764ba2;
}

.engine-item {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 50px;
  height: 100%;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  flex-shrink: 0;
  color: #667eea;
}

.engine-item:hover {
  background-color: #f8f9ff;
  color: #764ba2;
}

.engine-item.selected {
  background-color: #f0f4ff;
  color: #764ba2;
}

.search-input {
  flex: 1;
  height: 100%;
  border: none;
  outline: none;
  padding: 0 24px;
  font-size: 18px;
  color: #333;
  background-color: transparent;
}

.search-input::placeholder {
  color: #aaa;
}

.search-input:focus {
  outline: none;
}

/* transition-group 动画效果 */
.slide-enter-active,
.slide-leave-active {
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-enter-from,
.slide-leave-to {
  width: 0;
  opacity: 0;
  transform: translateX(-10px);
}

.slide-enter-to,
.slide-leave-from {
  width: 50px;
  opacity: 1;
  transform: translateX(0);
}

/* 确保transition-group布局正常 */
.slide-move {
  transition: transform 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
}
```

## 实现要点

1. 使用 Vue 的 transition-group 组件实现列表项的平滑动画
2. 通过 flex 布局确保 icon list 展开时自动挤压 input 空间
3. 为每个图标项设置延迟，实现逐个出现的效果
4. 使用 cubic-bezier 缓动函数使动画更加自然
5. 通过设置 flex-shrink: 0 确保图标项在动画过程中保持固定宽度
6. 使用 transform 和 opacity 实现平滑的进入/离开动画

## 注意事项

1. 确保搜索引擎列表项的 key 值唯一
2. 使用 @click.stop 防止事件冒泡
3. 图标列表展开时，确保不会覆盖输入框，而是在同一水平面上
4. 动画效果要流畅，避免卡顿
5. 响应式设计：根据需要调整不同屏幕尺寸下的搜索框宽度
