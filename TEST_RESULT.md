控制台报错：
WebsiteDialog.vue:97 [Vue warn]: Unhandled error during execution of watcher getter 
  at <WebsiteDialog modelValue=false onUpdate:modelValue=fn website=null  ... > 
  at <App>
warn$1 @ runtime-core.esm-bundler.js:51
logError @ runtime-core.esm-bundler.js:263
handleError @ runtime-core.esm-bundler.js:255
callWithErrorHandling @ runtime-core.esm-bundler.js:201
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
baseWatchOptions.call @ runtime-core.esm-bundler.js:880
getter @ reactivity.esm-bundler.js:1835
run @ reactivity.esm-bundler.js:237
job @ reactivity.esm-bundler.js:1884
watch @ reactivity.esm-bundler.js:1934
doWatch @ runtime-core.esm-bundler.js:908
watch2 @ runtime-core.esm-bundler.js:841
setup @ WebsiteDialog.vue:97
callWithErrorHandling @ runtime-core.esm-bundler.js:199
setupStatefulComponent @ runtime-core.esm-bundler.js:8040
setupComponent @ runtime-core.esm-bundler.js:8002
mountComponent @ runtime-core.esm-bundler.js:5939
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
mountChildren @ runtime-core.esm-bundler.js:5655
mountElement @ runtime-core.esm-bundler.js:5578
processElement @ runtime-core.esm-bundler.js:5533
patch @ runtime-core.esm-bundler.js:5391
componentUpdateFn @ runtime-core.esm-bundler.js:6051
run @ reactivity.esm-bundler.js:237
setupRenderEffect @ runtime-core.esm-bundler.js:6179
mountComponent @ runtime-core.esm-bundler.js:5953
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
render2 @ runtime-core.esm-bundler.js:6718
mount @ runtime-core.esm-bundler.js:4179
app.mount @ runtime-dom.esm-bundler.js:1826
(匿名) @ main.js:12
main.js:12 [Vue warn]: Unhandled error during execution of setup function 
  at <WebsiteDialog modelValue=false onUpdate:modelValue=fn website=null  ... > 
  at <App>
warn$1 @ runtime-core.esm-bundler.js:51
logError @ runtime-core.esm-bundler.js:263
handleError @ runtime-core.esm-bundler.js:255
callWithErrorHandling @ runtime-core.esm-bundler.js:201
setupStatefulComponent @ runtime-core.esm-bundler.js:8040
setupComponent @ runtime-core.esm-bundler.js:8002
mountComponent @ runtime-core.esm-bundler.js:5939
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
mountChildren @ runtime-core.esm-bundler.js:5655
mountElement @ runtime-core.esm-bundler.js:5578
processElement @ runtime-core.esm-bundler.js:5533
patch @ runtime-core.esm-bundler.js:5391
componentUpdateFn @ runtime-core.esm-bundler.js:6051
run @ reactivity.esm-bundler.js:237
setupRenderEffect @ runtime-core.esm-bundler.js:6179
mountComponent @ runtime-core.esm-bundler.js:5953
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
render2 @ runtime-core.esm-bundler.js:6718
mount @ runtime-core.esm-bundler.js:4179
app.mount @ runtime-dom.esm-bundler.js:1826
(匿名) @ main.js:12
WebsiteDialog.vue:97 Uncaught ReferenceError: Cannot access 'form' before initialization
    at WebsiteDialog.vue:97:24
    at callWithErrorHandling (runtime-core.esm-bundler.js:199:33)
    at callWithAsyncErrorHandling (runtime-core.esm-bundler.js:206:17)
    at baseWatchOptions.call (runtime-core.esm-bundler.js:880:47)
    at ReactiveEffect.getter [as fn] (reactivity.esm-bundler.js:1835:29)
    at ReactiveEffect.run (reactivity.esm-bundler.js:237:19)
    at job (reactivity.esm-bundler.js:1884:31)
    at watch (reactivity.esm-bundler.js:1934:7)
    at doWatch (runtime-core.esm-bundler.js:908:23)
    at watch2 (runtime-core.esm-bundler.js:841:10)
(匿名) @ WebsiteDialog.vue:97
callWithErrorHandling @ runtime-core.esm-bundler.js:199
callWithAsyncErrorHandling @ runtime-core.esm-bundler.js:206
baseWatchOptions.call @ runtime-core.esm-bundler.js:880
getter @ reactivity.esm-bundler.js:1835
run @ reactivity.esm-bundler.js:237
job @ reactivity.esm-bundler.js:1884
watch @ reactivity.esm-bundler.js:1934
doWatch @ runtime-core.esm-bundler.js:908
watch2 @ runtime-core.esm-bundler.js:841
setup @ WebsiteDialog.vue:97
callWithErrorHandling @ runtime-core.esm-bundler.js:199
setupStatefulComponent @ runtime-core.esm-bundler.js:8040
setupComponent @ runtime-core.esm-bundler.js:8002
mountComponent @ runtime-core.esm-bundler.js:5939
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
mountChildren @ runtime-core.esm-bundler.js:5655
mountElement @ runtime-core.esm-bundler.js:5578
processElement @ runtime-core.esm-bundler.js:5533
patch @ runtime-core.esm-bundler.js:5391
componentUpdateFn @ runtime-core.esm-bundler.js:6051
run @ reactivity.esm-bundler.js:237
setupRenderEffect @ runtime-core.esm-bundler.js:6179
mountComponent @ runtime-core.esm-bundler.js:5953
processComponent @ runtime-core.esm-bundler.js:5905
patch @ runtime-core.esm-bundler.js:5403
render2 @ runtime-core.esm-bundler.js:6718
mount @ runtime-core.esm-bundler.js:4179
app.mount @ runtime-dom.esm-bundler.js:1826
(匿名) @ main.js:12
content.js:5 [Content Script] StartPage Content Script 已加载
content.js:6 [Content Script] 当前页面 URL: http://localhost:5173/
content.js:7 [Content Script] document.readyState: interactive
content.js:172 [Content Script] 注册消息监听器
