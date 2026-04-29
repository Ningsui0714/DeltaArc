import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const apiTarget = process.env.VITE_API_TARGET ?? 'http://127.0.0.1:5001';
const devPort = Number(process.env.VITE_PORT ?? 3000);

export default defineConfig({
  plugins: [react()],
  server: {
    port: Number.isFinite(devPort) && devPort > 0 ? devPort : 3000,
    proxy: {
      '/api': {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
});
