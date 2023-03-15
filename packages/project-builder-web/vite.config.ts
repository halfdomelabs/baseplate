import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  process.env = { ...process.env, ...loadEnv(mode, process.cwd()) };

  return {
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    server: {
      port: 3210,
      proxy: {
        '/api': {
          target: process.env.VITE_DEV_BACKEND_HOST,
          changeOrigin: true,
        },
      },
    },
  };
});
