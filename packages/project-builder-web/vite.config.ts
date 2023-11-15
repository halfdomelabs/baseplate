import react from '@vitejs/plugin-react';
import dns from 'dns';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

dns.setDefaultResultOrder('verbatim');

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    plugins: [react(), viteTsconfigPaths(), svgrPlugin()],
    server: {
      port: envVars.PORT ? parseInt(envVars.PORT, 10) : 3000,
      proxy: envVars.DEV_BACKEND_HOST
        ? {
            '/api': {
              target: envVars.DEV_BACKEND_HOST,
              changeOrigin: true,
              ws: true,
            },
          }
        : undefined,
    },
    build: {
      sourcemap: true,
    },
  };
});
