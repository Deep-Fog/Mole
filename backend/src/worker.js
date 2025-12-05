// 导出 SignalingRoom 类，使其在 Cloudflare 平台中可用作 Durable Object
export { SignalingRoom } from "./SignalingRoom.js";

export default {
  /**
   * Worker 的主 fetch 处理程序
   * @param {Request} request - 传入的 HTTP 请求
   * @param {object} env - 包含环境变量和在 wrangler.toml 中定义的绑定
   * @param {object} ctx - 执行上下文
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // WebSocket 升级请求 - 检查 Upgrade 头
    if (request.headers.get("Upgrade") === "websocket") {
      // 从 URL 路径中获取房间 ID
      const roomId = path.slice(1); // 移除开头的 "/"

      // 如果房间 ID 为空，则返回错误
      if (!roomId) {
        return new Response("Invalid path", { status: 400 });
      }

      // 使用房间 ID 获取 Durable Object 的唯一 ID
      const id = env.SIGNALING_ROOM.idFromName(roomId);
      const room = env.SIGNALING_ROOM.get(id);

      // 将 WebSocket 请求转发给 Durable Object
      return room.fetch(request);
    }

    // 其他静态资源请求 - 使用 ASSETS 服务
    const response = await env.ASSETS.fetch(request);

    // SPA 路由支持：如果静态资源返回 404（文件未找到），
    // 且请求不是 API 或 WebSocket，则返回 index.html。
    // 这允许前端路由（React Router）接管 URL 处理。
    if (response.status === 404) {
      const indexUrl = new URL("/", request.url);
      return env.ASSETS.fetch(indexUrl);
    }

    return response;
  },
};