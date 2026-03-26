<script setup>
import { useSearchStore } from '../stores/search'

const searchStore = useSearchStore()

function closePanel() {
  searchStore.clearCommandMode()
}
</script>

<template>
  <div class="help-panel">
    <div class="help-header">
      <h2>命令模式帮助</h2>
      <button class="close-button" @click="closePanel" title="关闭">✕</button>
    </div>
    <div class="help-content">
        <div class="help-section">
          <h3>基础命令</h3>
          <div class="command-item">
            <code class="command">--theme</code>
            <span class="description">打开主题设置面板</span>
          </div>
          <div class="command-item">
            <code class="command">--search</code>
            <span class="description">打开搜索引擎设置面板</span>
          </div>
          <div class="command-item">
            <code class="command">--add</code>
            <span class="description">打开添加网站面板</span>
          </div>
          <div class="command-item">
            <code class="command">--import</code>
            <span class="description">打开导入数据面板</span>
          </div>
          <div class="command-item">
            <code class="command">--export</code>
            <span class="description">打开导出数据面板</span>
          </div>
          <div class="command-item">
            <code class="command">--layout</code>
            <span class="description">打开布局切换面板</span>
          </div>
          <div class="command-item">
            <code class="command">--help</code>
            <span class="description">显示此帮助信息</span>
          </div>
        </div>

        <div class="help-section">
          <h3>网站过滤命令</h3>
          <div class="command-item">
            <code class="command">--active</code>
            <span class="description">显示所有活动网站</span>
          </div>
          <div class="command-item">
            <code class="command">--active false</code>
            <span class="description">显示非活动网站（已删除）</span>
          </div>
          <div class="command-item">
            <code class="command">--inactive</code>
            <span class="description">显示非活动网站（已删除）</span>
          </div>
          <div class="command-item">
            <code class="command">--all</code>
            <span class="description">显示所有活跃且非隐藏的网站</span>
          </div>
          <div class="command-item">
            <code class="command">--marked</code>
            <span class="description">显示已标记的网站</span>
          </div>
          <div class="command-item">
            <code class="command">--unmarked</code>
            <span class="description">显示未标记的网站</span>
          </div>
          <div class="command-item">
            <code class="command">--hidden</code>
            <span class="description">显示隐藏的网站</span>
          </div>
          <div class="command-item">
            <code class="command">--visible</code>
            <span class="description">显示可见的网站</span>
          </div>
        </div>

        <div class="help-section">
          <h3>字段搜索命令</h3>
          <div class="command-item">
            <code class="command">--title [关键词]</code>
            <span class="description">只搜索网站标题</span>
          </div>
          <div class="command-item">
            <code class="command">--desc [关键词]</code>
            <span class="description">只搜索网站描述</span>
          </div>
          <div class="command-item">
            <code class="command">--name [关键词]</code>
            <span class="description">只搜索网站名称</span>
          </div>
          <div class="command-item">
            <code class="command">--url [关键词]</code>
            <span class="description">只搜索网站 URL</span>
          </div>
          <div class="example">
            例如：<code>--title 谷歌</code> 只搜索标题中包含"谷歌"的网站
          </div>
        </div>

        <div class="help-section">
          <h3>标签过滤命令</h3>
          <div class="command-item">
            <code class="command">--tag [标签名]</code>
            <span class="description">显示指定标签的网站</span>
          </div>
          <div class="example">
            例如：<code>--tag 技术</code>
          </div>
        </div>

        <div class="help-section">
          <h3>排序命令</h3>
          <div class="command-item">
            <code class="command">--visit</code>
            <span class="description">按访问次数排序</span>
          </div>
          <div class="command-item">
            <code class="command">--recent</code>
            <span class="description">按最近访问时间排序</span>
          </div>
        </div>

        <div class="help-section">
          <h3>组合使用</h3>
          <div class="command-item">
            <code class="command">--tag 技术 --visit</code>
            <span class="description">显示技术标签的网站，按访问次数排序</span>
          </div>
          <div class="command-item">
            <code class="command">--inactive --tag 工作</code>
            <span class="description">显示已删除且标签为工作的网站</span>
          </div>
        </div>

        <div class="help-section">
          <h3>普通搜索</h3>
          <p>直接输入关键词即可搜索网站名称、URL、描述或标签。支持多个关键词（空格分隔，AND关系）。</p>
          <div class="example">
            例如：<code>谷歌 百度</code> 搜索同时包含"谷歌"和"百度"的网站
          </div>
        </div>
    </div>
  </div>
</template>

<style scoped>
.help-panel {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  background-color: var(--color-bg-card);
  border-radius: 16px;
  box-shadow: var(--shadow-medium);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.help-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border-base);
}

.help-header h2 {
  margin: 0;
  font-size: 24px;
  color: var(--color-text-main);
}

.close-button {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  border: none;
  background-color: var(--color-bg-hover);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: var(--color-text-secondary);
  transition: all 0.3s ease;
}

.close-button:hover {
  background-color: var(--color-bg-active);
  color: var(--color-text-main);
}

.help-content {
  flex: 1;
  padding: 24px;
}

.help-section {
  margin-bottom: 32px;
}

.help-section h3 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--color-text-main);
  padding-bottom: 8px;
  border-bottom: 2px solid var(--color-primary);
}

.command-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.command {
  background-color: var(--color-bg-page);
  border: 1px solid var(--color-border-base);
  border-radius: 6px;
  padding: 6px 12px;
  font-family: 'Courier New', monospace;
  font-size: 14px;
  color: var(--color-primary);
  white-space: nowrap;
}

.description {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.example {
  margin-top: 8px;
  padding: 12px;
  background-color: var(--color-bg-page);
  border-radius: 8px;
  border-left: 3px solid var(--color-primary);
  color: var(--color-text-secondary);
  font-size: 14px;
}

.example code {
  background-color: var(--color-bg-hover);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Courier New', monospace;
  color: var(--color-primary);
}

.help-section p {
  margin: 0 0 12px 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

/* 滚动条样式 */
.help-content::-webkit-scrollbar {
  width: 8px;
}

.help-content::-webkit-scrollbar-track {
  background: var(--color-bg-page);
}

.help-content::-webkit-scrollbar-thumb {
  background: var(--color-border-base);
  border-radius: 4px;
}

.help-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-border-focus);
}
</style>
