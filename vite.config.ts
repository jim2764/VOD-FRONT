import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import http from 'node:http';

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), tailwindcss()],
  server: {
      proxy: {
        '/api': {
          target: 'http://vod-nginx:80', 
          changeOrigin: true,
          xfwd: true,
        },
        '/upload': {
          target: 'http://vod-nginx:80',
          changeOrigin: true,
        },
        '/hls': {
          target: 'http://vod-nginx:80',
          changeOrigin: true,

          agent: new http.Agent({
            keepAlive: true,
          }),
        }
      }
  }
})