"host_permissions": [
    "http://localhost:5173/",
    "http://localhost:5174/",
    "http://localhost:5175/",
    "https://dgf.cc.cd/",
    "http://dgf.cc.cd/"
],
这个是可以和扩展相互通信，扩展可以发送数据到网页，网页可以发送信息给扩展获取数据；


"action": {
    "default_popup": "popup.html"
},
这个是扩展可以执行的操作，就是在网页上打开一个弹窗，弹窗内容是这个HTML；


"content_scripts": [
    {
        "matches": ["<all_urls>"],
        "js": ["content.js"]
    }
],
这个是扩展可以注入脚本的网页 和 注入的脚本；


我的以上理解对吗