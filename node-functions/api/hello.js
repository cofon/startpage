/**
 * EdgeOne Node Functions - 基础测试
 *
 * 测试 EdgeOne Node Functions 环境是否正常工作
 *
 * API: GET /api/hello
 *
 * @param {Object} context - Node Functions 运行时的上下文对象，包含请求信息
 * @returns {Response} JSON 响应对象
 */
export default async function onRequest(context) {
  // 从请求中解析 URL 参数
  const url = new URL(context.request.url);
  const name = url.searchParams.get('name') || 'World';

  // CORS 预检请求处理
  if (context.request.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });
  }

  try {
    // 构建响应数据
    const responseData = {
      success: true,
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString(),
      method: context.request.method,
      path: url.pathname,
      query: Object.fromEntries(url.searchParams)
    };

    // 返回成功的 JSON 响应
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  } catch (error) {
    // 错误处理
    console.error('[Hello] 错误:', error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    );
  }
}
