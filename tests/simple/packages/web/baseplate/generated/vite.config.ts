import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    build: { outDir: 'build' },
    plugins: [tailwindcss(), react(), svgrPlugin(), viteTsconfigPaths()],
    server: {
      port: envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 3000,
      proxy: envVars.DEV_BACKEND_HOST
        ? {
            '/api': {
              target: envVars.DEV_BACKEND_HOST,
              changeOrigin: true,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
      watch: { ignored: ['**/baseplate/**'] },
    },
  };
});
