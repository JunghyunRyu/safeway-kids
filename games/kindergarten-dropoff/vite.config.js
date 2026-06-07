import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// 상대 경로(base: './')로 빌드 — 정적 호스팅 어디든 그대로 올릴 수 있게.
export default defineConfig({
  plugins: [react()],
  base: './',
});
