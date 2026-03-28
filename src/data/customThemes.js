/**
 * 自定义主题配置
 * 包含五个额外的主题：现代简约、暖色调、清新绿色、紫色优雅、中性灰色
 */

// 现代简约 - 柔和的紫色调
const modernTheme = {
  id: 'modern',
  name: '现代简约',
  colors: {
    // 基础颜色 - 紫色系
    primary: '#8b5cf6',
    primaryHover: '#7c3aed',
    primaryActive: '#6d28d9',

    // 文本颜色
    textMain: '#1f2937',
    textSecondary: '#4b5563',
    textDisabled: '#9ca3af',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#f9fafb',
    bgCard: '#ffffff',
    bgHover: '#f3f4f6',
    bgActive: '#e5e7eb',

    // 边框和阴影
    borderBase: '#d1d5db',
    borderFocus: '#a78bfa',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 暖色调 - 温暖的橙色调
const warmTheme = {
  id: 'warm',
  name: '暖色调',
  colors: {
    // 基础颜色 - 橙色调
    primary: '#f97316',
    primaryHover: '#ea580c',
    primaryActive: '#c2410c',

    // 文本颜色
    textMain: '#292524',
    textSecondary: '#57534e',
    textDisabled: '#a8a29e',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#fffbeb',
    bgCard: '#ffffff',
    bgHover: '#fef3c7',
    bgActive: '#fde68a',

    // 边框和阴影
    borderBase: '#d6d3d1',
    borderFocus: '#fb923c',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 清新绿色 - 活力的绿色调
const greenTheme = {
  id: 'green',
  name: '清新绿色',
  colors: {
    // 基础颜色 - 绿色调
    primary: '#10b981',
    primaryHover: '#059669',
    primaryActive: '#047857',

    // 文本颜色
    textMain: '#134e4a',
    textSecondary: '#334155',
    textDisabled: '#64748b',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#f0fdf4',
    bgCard: '#ffffff',
    bgHover: '#dcfce7',
    bgActive: '#bbf7d0',

    // 边框和阴影
    borderBase: '#d1d5db',
    borderFocus: '#34d399',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 紫色优雅 - 高贵的紫色调
const purpleTheme = {
  id: 'purple',
  name: '紫色优雅',
  colors: {
    // 基础颜色 - 深紫色调
    primary: '#7e22ce',
    primaryHover: '#6b21a8',
    primaryActive: '#581c87',

    // 文本颜色
    textMain: '#1e1b4b',
    textSecondary: '#4338ca',
    textDisabled: '#9333ea',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#faf5ff',
    bgCard: '#ffffff',
    bgHover: '#f3e8ff',
    bgActive: '#e9d5ff',

    // 边框和阴影
    borderBase: '#d8b4fe',
    borderFocus: '#a855f7',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

// 中性灰色 - 简约的灰色调
const neutralTheme = {
  id: 'neutral',
  name: '中性灰色',
  colors: {
    // 基础颜色 - 灰色调
    primary: '#6b7280',
    primaryHover: '#4b5563',
    primaryActive: '#374151',

    // 文本颜色
    textMain: '#111827',
    textSecondary: '#374151',
    textDisabled: '#9ca3af',
    textOnPrimary: '#ffffff',

    // 背景颜色
    bgPage: '#f3f4f6',
    bgCard: '#ffffff',
    bgHover: '#e5e7eb',
    bgActive: '#d1d5db',

    // 边框和阴影
    borderBase: '#e5e7eb',
    borderFocus: '#9ca3af',
    shadowLight: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    shadowMedium: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    shadowDark: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
}

export default [modernTheme, warmTheme, greenTheme, purpleTheme, neutralTheme]
