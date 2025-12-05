import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // 添加 node-polyfills 插件
    // 這會為 simple-peer 所依賴的 'stream', 'events', 'util' 等 Node.js 核心模塊
    // 提供瀏覽器端的兼容版本（Polyfill）
    nodePolyfills(), 
  ],
})