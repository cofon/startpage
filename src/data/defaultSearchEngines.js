/**
 * 默认搜索引擎配置
 */

const defaultSearchEngines = [
  {
    id: 'baidu',
    name: '百度',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="16" fill="currentColor"/>
  <text x="20" y="26" text-anchor="middle" font-size="20" font-weight="bold" fill="white">B</text>
</svg>`,
    template: 'https://www.baidu.com/s?wd={query}',
    iconColor: '#2932e1',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'bing',
    name: '必应',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="16" fill="currentColor"/>
  <text x="20" y="26" text-anchor="middle" font-size="20" font-weight="bold" fill="white">B</text>
</svg>`,
    template: 'https://www.bing.com/search?q={query}',
    iconColor: '#008373',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'yandex',
    name: 'Yandex',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="16" fill="currentColor"/>
  <text x="20" y="26" text-anchor="middle" font-size="20" font-weight="bold" fill="white">Y</text>
</svg>`,
    template: 'https://yandex.com/search/?text={query}',
    iconColor: '#fc3f1d',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'local',
    name: '本地',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">
  <circle cx="20" cy="20" r="16" fill="currentColor"/>
  <text x="20" y="26" text-anchor="middle" font-size="20" font-weight="bold" fill="white">L</text>
</svg>`,
    template: '',
    iconColor: '#6b7280',
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
]

export default defaultSearchEngines
