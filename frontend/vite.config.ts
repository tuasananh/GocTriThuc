import tailwindcss from '@tailwindcss/vite';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const rootEnv = loadEnv(mode, '../', '');

  const port = parseInt(env.FRONTEND_PORT || rootEnv.FRONTEND_PORT || '5173');
  const backendPort = env.APP_PORT || rootEnv.APP_PORT || '8080';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: port,
      proxy: {
        '/api': `http://localhost:${backendPort}`,
        '/oauth2': `http://localhost:${backendPort}`,
      },
    },
  };
});
