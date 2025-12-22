import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // 设置 @ 指向 src 目录，这样引用组件更方便
      '@': path.resolve(__dirname, './src'), 
    }
  },
  // 关键修复：Cloudflare Pages 部署时，base 保持默认的 '/' 即可
  // 删除了 define 部分，防止密钥泄露到前端
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  build: {
    outDir: 'dist', // 明确告诉构建工具输出目录叫 dist
  }
});