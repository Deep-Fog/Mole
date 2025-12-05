# Mole 🐹

<div align="center">
  <img src="./frontend/public/main_icon.png" width="300" height="auto" alt="示例图片">
</div>

Mole 是一个现代化的点对点 (P2P) 文件传输应用。它利用 WebRTC 技术实现浏览器之间的直接数据传输，并通过 Cloudflare Workers (Durable Objects) 进行轻量级的信令交换。

## ✨ 主要功能

- **P2P 文件传输**: 无需经过服务器中转，直接在用户间传输文件，速度更快且更隐私。
- **房间与大厅系统**: 用户可以创建房间或在公共大厅等待连接 (`SignalingRoom`).
- **雷达扫描 UI**: 直观的雷达界面 (`Radar.jsx`) 展示附近的节点或连接状态。
- **STUN 服务器选择**: 内置 STUN 测试工具 (`stunTester.js`)，允许用户选择最佳的 STUN 服务器以穿透 NAT。
- **国际化支持 (i18n)**: 支持中文和英文切换 (`locales/`).
- **主题切换**: 支持深色/浅色模式。
- **现代化 UI**: 基于 Tailwind CSS 构建的响应式界面。

## 🛠 技术栈

### 前端 (Frontend)
- **核心框架**: [React](https://reactjs.org/)
- **构建工具**: [Vite](https://vitejs.dev/)
- **样式库**: [Tailwind CSS](https://tailwindcss.com/)
- **WebRTC**: `RTCPeerConnection`, `RTCDataChannel`

### 后端 (Backend)
- **运行时**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **状态管理**: Cloudflare Durable Objects (用于信令房间状态)
- **部署工具**: Wrangler

## 快速开始

### 前置要求
- [Node.js](https://nodejs.org/) (建议 v18+)
- [Cloudflare Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/install-and-update/) (用于后端开发)

### 1. 后端设置 (Signaling Server)

后端负责处理 WebSocket 信令连接。

```bash
cd backend
npm install

# 本地启动开发服务器
npx wrangler dev
```

### 2. 前端设置 (Client)

前端是用户交互的界面。

```bash
cd frontend
npm install

# 复制环境变量配置（如果有需要修改的配置）
cp .env.example .env

# 启动前端开发服务器
npm run dev
```

打开浏览器访问 `http://localhost:5173` (默认端口)。

## 📂 项目结构

```
D:\Project\mole
├── backend/             # Cloudflare Worker 信令服务
│   ├── src/
│   │   ├── SignalingRoom.js  # Durable Object 房间逻辑
│   │   └── worker.js         # Worker 入口点
│   └── wrangler.toml         # Cloudflare 配置
├── frontend/            # React 前端应用
│   ├── src/
│   │   ├── components/  # UI 组件 (FileTransfer, Radar, etc.)
│   │   ├── hooks/       # 自定义 Hooks (usePeers)
│   │   ├── utils/       # 工具函数 (STUN tester)
│   │   └── locales/     # 国际化翻译文件
│   └── vite.config.js   # Vite 配置
└── package.json
```

## 🤝 贡献

欢迎提交 Pull Requests 或 Issues 来改进这个项目！

