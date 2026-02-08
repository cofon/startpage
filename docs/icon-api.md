## icon API

### 可用：
- FaviconSnap
    - https://faviconsnap.com/api/favicon?url=${domain}
    - 测试网站25个, 成功24个
    - https://faviconsnap.com/zh
    - 优先级最高
- IconHorse服务
    - https://icon.horse/icon/${domain} 
    - 测试网站25个, 成功24个
    - 限制每月1000 
    - https://icon.horse/
    - 优先级第二(虽然获取成功率高，但是有次数限制)
- faviconPub
    - https://favicon.pub/api/${domain}
    - 测试网站25个, 成功18个
    - https://favicon.pub/cn/favicon-fetcher
- AFMAX图标API
    - https://api.afmax.cn/so/ico/index.php?r=${domain}
    - 测试网站25个, 成功15个
    - https://files.api.afmax.cn/archives/wei-ming-ming-wen-zhang-JVMh2FEN

### 跨域cors限制
- https://favicon.is/${domain}

### 不可用：
- Google                      https://www.google.com/s2/favicons?domain=${domain}&sz=64
- 比特服图标API          https://tool.bitefu.net/ico/?url=${domain}&type=1
- 咕咕数据图标API      https://api.gugudata.com/websitetools/favicon?url=${encodeURIComponent(domain)}
- BestIcon服务            https://besticon-demo.herokuapp.com/icon?url=${domain}&size=80..120..200

