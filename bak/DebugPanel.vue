<template>
  <div :class="['debug-panel', { 'inline-mode': inline }]" v-if="show">
    <div class="debug-header">
      <h3>调试信息</h3>
      <button v-if="!inline" @click="clearLogs">清空</button>
      <button @click="toggleShow">{{ inline ? '关闭' : '隐藏' }}</button>
    </div>
    <div class="debug-content" ref="content">
      <div v-for="(log, index) in logs" :key="index" class="log-item" :class="log.type">
        <span class="log-time">{{ log.time }}</span>
        <span class="log-tag">{{ log.tag }}</span>
        <pre class="log-message">{{ formatMessage(log.message) }}</pre>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DebugPanel',
  props: {
    inline: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      show: true,
      logs: []
    }
  },
  methods: {
    addLog(tag, message, type = 'info') {
      const time = new Date().toLocaleTimeString()
      this.logs.push({ tag, message, type, time })
      this.$nextTick(() => {
        if (this.$refs.content) {
          this.$refs.content.scrollTop = this.$refs.content.scrollHeight
        }
      })
    },
    clearLogs() {
      this.logs = []
    },
    toggleShow() {
      this.show = !this.show
    },
    formatMessage(message) {
      if (typeof message === 'object') {
        return JSON.stringify(message, null, 2)
      }
      return String(message)
    }
  }
}
</script>

<style scoped>
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  width: 500px;
  max-height: 80vh;
  background: #1e1e1e;
  color: #d4d4d4;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  z-index: 99999;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  border: 2px solid #569cd6;
}

.debug-panel.inline-mode {
  position: relative;
  top: 0;
  right: 0;
  width: 100%;
  max-height: 100%;
  border-radius: 0;
  box-shadow: none;
  z-index: 1;
  border: none;
  border-top: 2px solid #569cd6;
}

.debug-header {
  padding: 10px 15px;
  background: #2d2d2d;
  border-bottom: 1px solid #3e3e3e;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-radius: 8px 8px 0 0;
}

.debug-header h3 {
  margin: 0;
  font-size: 14px;
  color: #569cd6;
}

.debug-header button {
  padding: 4px 12px;
  margin-left: 8px;
  background: #0e639c;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.debug-header button:hover {
  background: #1177bb;
}

.debug-content {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  max-height: calc(80vh - 50px);
}

.log-item {
  padding: 8px;
  margin-bottom: 8px;
  border-radius: 4px;
  background: #252526;
  border-left: 3px solid #569cd6;
}

.log-item.error {
  border-left-color: #f44336;
}

.log-item.warn {
  border-left-color: #ff9800;
}

.log-item.success {
  border-left-color: #4caf50;
}

.log-time {
  color: #858585;
  margin-right: 8px;
}

.log-tag {
  color: #569cd6;
  font-weight: bold;
  margin-right: 8px;
}

.log-message {
  margin: 4px 0 0 0;
  color: #d4d4d4;
  white-space: pre-wrap;
  word-wrap: break-word;
  max-height: 300px;
  overflow: auto;
}
</style>
