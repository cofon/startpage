// 错误
// export default async function () {
//   return new Response("Hello from EdgeOne Pages!");
// }


// 注意：导出名称必须是 onRequest (匹配所有方法) 或 onRequestGet (仅限 GET)
// https://startpage-rjh1mdmj.edgeone.cool/api/hello
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
export default function onRequest(context) {
  // 1. 获取完整的请求 URL 对象
  const { searchParams } = new URL(context.request.url);

  // 2. 获取名为 'target' 的参数
  const targetUrl = searchParams.get('target');

  if (!targetUrl) {
    return new Response("Missing 'target' parameter", { status: 400 });
  }

  return new Response(`You sent the target URL: ${targetUrl}`);
}
