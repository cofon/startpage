/**
 * 默认搜索引擎配置
 */

const defaultSearchEngines = [
  {
    id: 'baidu',
    name: '百度',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
  <circle cx="11" cy="11" r="8"/>
  <path d="m21 21-4.35-4.35"/>
  <text x="11" y="14" text-anchor="middle" font-size="10" fill="currentColor">百</text>
</svg>`,
    template: 'https://www.baidu.com/s?wd={query}',
    iconColor: '#2932e1',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bing',
    name: '必应',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="8" fill="currentColor"/>
  <path d="m21 21-4.35-4.35" fill="currentColor"/>
  <text x="11" y="14" text-anchor="middle" font-size="10" fill="white">必</text>
</svg>`,
    template: 'https://www.bing.com/search?q={query}',
    iconColor: '#008373',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'yandex',
    name: 'Yandex',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="8" fill="currentColor"/>
  <path d="m21 21-4.35-4.35" fill="currentColor"/>
  <text x="11" y="14" text-anchor="middle" font-size="10" fill="white">Y</text>
</svg>`,
    template: 'https://yandex.com/search/?text={query}',
    iconColor: '#fc3f1d',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'local',
    name: '本地',
    icon: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
  <circle cx="11" cy="11" r="8" fill="currentColor"/>
  <path d="m21 21-4.35-4.35" fill="currentColor"/>
  <text x="11" y="14" text-anchor="middle" font-size="10" fill="white">本</text>
</svg>`,
    template: '',
    iconColor: '#6b7280',
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default defaultSearchEngines
