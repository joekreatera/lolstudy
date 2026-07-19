import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Same-origin in production (Nginx serves the build and proxies /api).
// In development we proxy /api to the local FastAPI server so the frontend
// can call same-origin paths in dev exactly as it will in production.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
});
