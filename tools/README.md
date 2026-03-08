# Website Fetcher - 网站数据获取工具

## 功能说明

用于批量获取网站的数据，包括：
- 网站标题
- 网站描述
- 网站图标（base64格式）
- 本地生成的SVG图标

## 安装依赖

```bash
pip install requests beautifulsoup4 pillow tqdm favicon
```

## 使用方法

### 1. 准备URL列表

创建一个 `urls.txt` 文件，每行一个URL：

```
https://github.com
https://stackoverflow.com
https://npmjs.com
```

### 2. 运行程序

```bash
python main.py
```

### 3. 查看结果

程序会生成 `websites.json` 文件，包含所有获取到的网站数据。

## 数据格式

生成的数据格式如下：

```json
{
  "url": "https://github.com",
  "name": "GitHub: Let's build from here",
  "description": "GitHub is where over 100 million developers shape the future of software, together. Contribute to the open source community, manage your Git repositories, review code like a pro, track bugs and features, power your CI/CD and DevOps workflows, and secure software before you ship it.",
  "icon": "",
  "iconUrl": "",
  "iconData": "base64编码的图标数据",
  "iconGenerateData": "base64编码的SVG图标",
  "iconCanFetch": true,
  "iconFetchAttempts": 1,
  "iconLastFetchTime": "2024-01-01T00:00:00",
  "tags": [],
  "isMarked": false,
  "markOrder": 0,
  "visitCount": 0,
  "lastVisited": null,
  "createdAt": "2024-01-01T00:00:00",
  "updatedAt": "2024-01-01T00:00:00",
  "isActive": true,
  "isHidden": false
}
```

## 导入到起始页

在起始页中使用 `--import` 命令导入生成的 `websites.json` 文件。

websites.json格式:
{
    "websites": [
      {website1},
      {website2},
      {website3}
    ]
}
