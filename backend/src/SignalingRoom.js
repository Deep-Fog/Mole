export class SignalingRoom {
  constructor(state, env) {
    this.state = state;
    // 使用 Map 以通过 ID 进行 O(1) 查找
    this.sessions = new Map(); 
  }

  async fetch(request) {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }
    const webSocketPair = new WebSocketPair();
    const { 0: client, 1: server } = webSocketPair;
    this.handleSession(server);
    return new Response(null, { status: 101, webSocket: client });
  }

  handleSession(websocket) {
    websocket.accept();
    
    // 暂时存储，直到我们从 'join' 消息中获取 ID
    // 我们还不能添加到 Map 中，因为还没有 ID
    // 但我们需要跟踪它以便关闭/错误处理
    // 实际上，我们可以在闭包作用域或临时 Set 中处理它。
    // 但更简单的方法是：只需附加事件监听器。
    // 'join' 消息会将它添加到 Map 中。
    
    // 然而，如果它在加入之前关闭，我们需要处理 'close'。
    // 所以让我们保持一个临时的弱引用或者仅仅依赖闭包。
    // 一个常见的模式是为“已连接但未加入”使用单独的 Set
    // 或者仔细处理清理工作。
    
    // 让我们优化一下：
    // 我们只在收到带有 ID 的 'join' 消息时才添加到 this.sessions Map。
    // 但是等等，如果我们不存储它，垃圾回收机制会回收它吗？
    // WebSocket API 只要连接着就会保持它的活性。

    websocket.addEventListener("message", async (event) => {
      try {
        const message = JSON.parse(event.data);

        // 根据消息类型处理不同逻辑
        switch (message.type) {
          case 'join':
            // 当一个节点加入时，我们将 ID 关联到其 WebSocket 实例
            websocket.id = message.id;
            this.sessions.set(message.id, websocket);
            
            // 找到房间里所有其他的节点
            const otherPeers = Array.from(this.sessions.keys()).filter(id => id !== websocket.id);

            // 1. 告诉当前加入的节点，房间里已经有谁了
            websocket.send(JSON.stringify({ type: 'all-peers', peers: otherPeers }));

            // 2. 告诉房间里所有其他的节点，有新人加入了
            this.broadcast({ type: 'peer-joined', id: websocket.id }, websocket);
            break;

          case 'signal':
            // 这是一个 WebRTC 信令消息，需要精准转发给 'to' 指定的节点
            const targetSession = this.sessions.get(message.to);
            if (targetSession) {
                targetSession.send(JSON.stringify({
                    type: 'signal',
                    from: message.from,
                    signal: message.signal,
                }));
            }
            break;
            
          default:
            console.warn("Unhandled message type:", message.type);
        }

      } catch (err) {
        console.error("Error processing message:", err);
      }
    });

    const closeOrErrorHandler = () => {
      // 仅当它有 ID（已被添加到 Map）时才尝试移除
      if (websocket.id) {
        this.sessions.delete(websocket.id);
        // 广播有人离开的消息
        this.broadcast({ type: 'peer-left', id: websocket.id }, null); 
      }
    };
    websocket.addEventListener("close", closeOrErrorHandler);
    websocket.addEventListener("error", closeOrErrorHandler);
  }

  /**
   * @param {object} message - 要发送的 JSON 对象
   * @param {WebSocket} sender - 发送者，广播时会跳过此目标
   */
  broadcast(message, sender) {
    const messageStr = JSON.stringify(message);
    for (const session of this.sessions.values()) {
      // 确保 session 不是发送者
      if (session !== sender && session.readyState === WebSocket.OPEN) {
        try {
          session.send(messageStr);
        } catch (err) {
          console.error(`Error sending to session ${session.id}:`, err);
        }
      }
    }
  }
}