import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return {
    build: { outDir: 'build' },
    plugins: [
      tailwindcss(),
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        generatedRouteTree: './src/route-tree.gen.ts',
        quoteStyle: 'single',
      }),
      react(),
      svgrPlugin(),
      viteTsconfigPaths(),
    ],
    server: {
      port: envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 3000,
      proxy: envVars.DEV_BACKEND_HOST
        ? {
            '/api': {
              target: envVars.DEV_BACKEND_HOST,
              rewrite: (path) => path.replace(/^\/api/, ''),
            },
          }
        : undefined,
      watch: { ignored: ['**/baseplate/**'] },
    },
  };
});
