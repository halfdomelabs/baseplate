import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

  return /* TPL_CONFIG:START */ {
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
              configure: (proxy) => {
                // Vite's dev proxy does not forward an upstream connection
                // close to the browser for streaming responses (SSE), so a
                // backend restart leaves the client hanging instead of
                // reconnecting. Destroy the client response when the upstream
                // response ends. See https://github.com/vitejs/vite/issues/20712
                proxy.on('proxyRes', (proxyRes, _req, res) => {
                  proxyRes.on('close', () => {
                    if (!res.writableEnded) {
                      res.destroy();
                    }
                  });
                });
              },
            },
          }
        : undefined,
      watch: { ignored: ['**/baseplate/**'] },
    },
  } /* TPL_CONFIG:END */;
});
