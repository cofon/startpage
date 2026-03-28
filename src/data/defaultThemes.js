/**
 * 默认主题配置
 * 包含三个主题：浅色（蓝色主色调）、深色、跟随系统
 */

// 浅色主题 - 蓝色主色调
const lightTheme = {
  id: 'light',
  name: '浅色',
  colors: {
    // 基础颜色 - 蓝色系
    primary: '#2563eb',
    primaryHover: '#1d4ed8',
    primaryActive: '#1e40af',

    // 文本颜色
    textMain: '#0f172a',
    textSecondary: '#475569',
    textDisabled: '#94a3b8',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#f8fafc',
    bgCard: '#ffffff',
    bgHover: '#f1f5f9',
    bgActive: '#e2e8f0',

    // 边框和阴影
    borderBase: '#cbd5e1',
    borderFocus: '#3b82f6',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 深色主题
const darkTheme = {
  id: 'dark',
  name: '深色',
  colors: {
    // 基础颜色 - 蓝色系（保持与浅色一致的主色调）
    primary: '#3b82f6',
    primaryHover: '#60a5fa',
    primaryActive: '#93c5fd',

    // 文本颜色
    textMain: '#f1f5f9',
    textSecondary: '#cbd5e1',
    textDisabled: '#64748b',
    textOnPrimary: '#0f172a',

    // 背景颜色
    bgPage: '#0f172a',
    bgCard: '#1e293b',
    bgHover: '#334155',
    bgActive: '#475569',

    // 边框和阴影
    borderBase: '#334155',
    borderFocus: '#3b82f6',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 跟随系统主题 - 实际会根据系统偏好自动切换
const autoTheme = {
  id: 'auto',
  name: '跟随系统',
  colors: {
    // 默认使用浅色主题的颜色
    ...lightTheme.colors
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export default [lightTheme, darkTheme, autoTheme]
