// 错误
// export default async function () {
//   return new Response("Hello from EdgeOne Pages!");
// }



//  curl -v http://localhost:8088/api/hello?target=abc
// StatusCode        : 200
// StatusDescription : OK
// Content           : You sent the target URL: abc

//  curl -v http://localhost:8088/api/hello?target=https://www.baidu.com
// StatusCode        : 200
// StatusDescription : OK
// Content           : You sent the target URL: abc


// export default function onRequest(context) {
//   // 1. 获取完整的请求 URL 对象
//   const { searchParams } = new URL(context.request.url);

//   // 2. 获取名为 'target' 的参数
//   const targetUrl = searchParams.get('target');

//   if (!targetUrl) {
//     return new Response("Missing 'target' parameter", { status: 400 });
//   }

//   return new Response(`You sent the target URL: ${targetUrl}`);
// }


// 注意：导出名称必须是 onRequest (匹配所有方法) 或 onRequestGet (仅限 GET)
// http://startpage-rjh1mdmj.edgeone.cool/api/hello
// 测试通过，可以获取到 Hello from EdgeOne Pages!
// export default function onRequest() {
//   return new Response("Hello from EdgeOne Pages!");
// }

// async
// export const onRequest = async (context) => {
//   return new Response("Hello from EdgeOne Pages!");
// };


// 测试带有参数的 API
// https://startpage-rjh1mdmj.edgeone.cool/api/hello?target=https://www.baidu.com
// 测试通过，可以获取到 You sent the target URL: https://www.baidu.com
// 调试版本 - 添加详细日志和 URL 解码
// export default function onRequest(context) {
//   console.log('[hello.js] 请求开始');
//   console.log('[hello.js] 完整 URL:', context.request.url);
//   console.log('[hello.js] 请求方法:', context.request.method);

//   // 1. 获取完整的请求 URL 对象
//   const { searchParams } = new URL(context.request.url);

//   // 2. 获取名为 'target' 的参数
//   let targetUrl = searchParams.get('target');

//   console.log('[hello.js] 原始 target 参数:', targetUrl);

//   // 如果参数看起来是编码的，尝试解码
//   if (targetUrl && targetUrl.includes('%')) {
//     try {
//       targetUrl = decodeURIComponent(targetUrl);
//       console.log('[hello.js] 解码后的 target:', targetUrl);
//     } catch (e) {
//       console.warn('[hello.js] 解码失败，使用原始值:', e.message);
//     }
//   }

//   if (!targetUrl) {
//     console.log('[hello.js] 缺少 target 参数');
//     return new Response("Missing 'target' parameter", {
//       status: 400,
//       headers: { 'Content-Type': 'text/plain' }
//     });
//   }

//   const responseText = `You sent the target URL: ${targetUrl}`;
//   console.log('[hello.js] 返回响应:', responseText);

//   return new Response(responseText, {
//     status: 200,
//     headers: { 'Content-Type': 'text/plain' }
//   });
// }

// 最简版本 - 测试基础功能
// export default function onRequest() {
//   return new Response("Hello from API!", {
//     status: 200,
//     headers: { 'Content-Type': 'text/plain' }
//   });
// }

// 完整版 - 支持 URL 参数和解码
export default function onRequest(context) {
  console.log('[hello.js] 请求开始');
  console.log('[hello.js] 完整 URL:', context.request.url);

  // 1. 获取完整的请求 URL 对象
  const { searchParams } = new URL(context.request.url);

  // 2. 获取名为 'target' 的参数
  let targetUrl = searchParams.get('target');

  console.log('[hello.js] 原始 target 参数:', targetUrl);

  // 如果参数看起来是编码的，尝试解码
  if (targetUrl && targetUrl.includes('%')) {
    try {
      targetUrl = decodeURIComponent(targetUrl);
      console.log('[hello.js] 解码后的 target:', targetUrl);
    } catch (e) {
      console.warn('[hello.js] 解码失败，使用原始值:', e.message);
    }
  }

  if (!targetUrl) {
    console.log('[hello.js] 缺少 target 参数');
    return new Response("Missing 'target' parameter", {
      status: 400,
      headers: { 'Content-Type': 'text/plain' }
    });
  }

  const responseText = `You sent the target URL: ${targetUrl}`;
  console.log('[hello.js] 返回响应:', responseText);

  return new Response(responseText, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}
