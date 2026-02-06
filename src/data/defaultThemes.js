/**
 * 默认主题配置
 */

// 默认颜色定义
const defaultColors = {
  // 基础颜色
  primary: '#3b82f6',
  primaryHover: '#2563eb',
  primaryActive: '#1d4ed8',

  // 文本颜色
  textMain: '#1f2937',
  textSecondary: '#6b7280',
  textDisabled: '#9ca3af',
  textOnPrimary: '#ffffff',

  // 背景颜色
  bgPage: '#f9fafb',
  bgCard: '#ffffff',
  bgHover: '#f3f4f6',
  bgActive: '#e5e7eb',

  // 边框和阴影
  borderBase: '#e5e7eb',
  borderFocus: '#3b82f6',
  shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
}

// 浅色主题
const lightTheme = {
  id: 'light',
  name: '浅色',
  colors: {
    ...defaultColors
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 深色主题
const darkTheme = {
  id: 'dark',
  name: '深色',
  colors: {
    // 基础颜色
    primary: '#60a5fa',
    primaryHover: '#3b82f6',
    primaryActive: '#2563eb',

    // 文本颜色
    textMain: '#f9fafb',
    textSecondary: '#d1d5db',
    textDisabled: '#9ca3af',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#111827',
    bgCard: '#1f2937',
    bgHover: '#374151',
    bgActive: '#4b5563',

    // 边框和阴影
    borderBase: '#374151',
    borderFocus: '#60a5fa',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.4)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 跟随系统主题
const autoTheme = {
  id: 'auto',
  name: '跟随系统',
  colors: {
    ...defaultColors
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export default [lightTheme, darkTheme, autoTheme]
