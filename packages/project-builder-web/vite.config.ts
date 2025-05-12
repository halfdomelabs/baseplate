import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

import { pluginDevServerPlugin } from './plugins/plugin-dev-server.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const PORT = envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 3000;
  const localhostOriginRegex = new RegExp(
    `^(http|w)://(localhost|127.0.0.1|[::1]):${PORT}`,
  );

  return {
    plugins: [
      react(),
      viteTsconfigPaths(),
      svgrPlugin(),
      federation({
        name: 'project-builder-web',
        remotes: {
          placeholder: 'http://localhost:3001/remoteEntry.js',
        },
        shared: {
          react: {},
          'react-dom': {},
          zod: {},
          '@halfdomelabs/project-builder-lib': { version: '*' },
          '@halfdomelabs/project-builder-lib/web': {
            version: '*',
          },
          '@halfdomelabs/ui-components': { version: '*' },
        },
      }),
      pluginDevServerPlugin(),
    ],
    server: {
      port: PORT,
      proxy: envVars.DEV_BACKEND_HOST
        ? {
            '/api': {
              target: envVars.DEV_BACKEND_HOST,
              changeOrigin: true,
              ws: true,
            },
            '/trpc': {
              target: envVars.DEV_BACKEND_HOST,
              changeOrigin: true,
              ws: true,
              // ensure we rewrite origin only if it comes from our site
              configure: (proxy) => {
                proxy.on('proxyReq', (proxyReq) => {
                  const origin = proxyReq.getHeader('origin');
                  if (typeof origin !== 'string') return;
                  if (!envVars.DEV_BACKEND_HOST) return;

                  if (localhostOriginRegex.test(origin)) {
                    proxyReq.setHeader('origin', envVars.DEV_BACKEND_HOST);
                  }
                });
                proxy.on('proxyReqWs', (proxyReq) => {
                  const origin = proxyReq.getHeader('origin');
                  if (typeof origin !== 'string') return;
                  if (!envVars.DEV_BACKEND_HOST) return;

                  if (localhostOriginRegex.test(origin)) {
                    proxyReq.setHeader('origin', envVars.DEV_BACKEND_HOST);
                  }
                });
              },
            },
          }
        : undefined,
    },
    build: {
      // needed to support top-level await for module federation
      target: 'esnext',
      sourcemap: true,
    },
  };
});
