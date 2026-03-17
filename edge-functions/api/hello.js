// 错误
// export default async function () {
//   return new Response("Hello from EdgeOne Pages!");
// }


// 注意：导出名称必须是 onRequest (匹配所有方法) 或 onRequestGet (仅限 GET)
export default function onRequest() {
  return new Response("Hello from EdgeOne Pages!");
}

// async
// export const onRequest = async (context) => {
//   return new Response("Hello from EdgeOne Pages!");
// };
