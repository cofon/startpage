/**
 * 默认搜索引擎配置
 */

const defaultSearchEngines = [
  {
    id: 'baidu',
    name: '百度',
    icon: '/icons/search-engines/baidu.svg',
    template: 'https://www.baidu.com/s?wd={query}',
    iconColor: '#2932e1',
    order: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'bing',
    name: '必应',
    icon: '/icons/search-engines/bing.svg',
    template: 'https://www.bing.com/search?q={query}',
    iconColor: '#008373',
    order: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'yandex',
    name: 'Yandex',
    icon: '/icons/search-engines/yandex.svg',
    template: 'https://yandex.com/search/?text={query}',
    iconColor: '#fc3f1d',
    order: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'local',
    name: '本地',
    icon: '/icons/search-engines/local.svg',
    template: '',
    iconColor: '#6b7280',
    order: 4,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

export default defaultSearchEngines
