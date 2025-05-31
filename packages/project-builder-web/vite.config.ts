import type { ClientRequest } from 'node:http';

import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';

import { pluginDevServerPlugin } from './plugins/plugin-dev-server.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };
  const PORT = envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 3000;

  return {
    plugins: [
      react(),
      srcSubpathImportPlugin(import.meta.dirname),
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
          '@baseplate-dev/project-builder-lib': { version: '*' },
          '@baseplate-dev/project-builder-lib/web': {
            version: '*',
          },
          '@baseplate-dev/ui-components': { version: '*' },
        },
      }),
      pluginDevServerPlugin(),
      tailwindcss(),
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
              configure: (proxy) => {
                const rewriteOriginIfLocalhost = (
                  proxyReq: ClientRequest,
                ): void => {
                  const origin = proxyReq.getHeader('origin');

                  // Regex for this dev server instance URLs
                  const devServerRegex = new RegExp(
                    `^(http|https|ws|wss)://(localhost|127.0.0.1|\\[::1\\]):${PORT}$`,
                  );

                  // Rewrite localhost origin to match backend host only if it comes from the Vite dev server
                  if (
                    typeof origin === 'string' &&
                    envVars.DEV_BACKEND_HOST &&
                    devServerRegex.test(origin)
                  ) {
                    proxyReq.setHeader('origin', envVars.DEV_BACKEND_HOST);
                  }
                };

                // Apply to both HTTP and WebSocket requests
                proxy.on('proxyReq', rewriteOriginIfLocalhost);
                proxy.on('proxyReqWs', rewriteOriginIfLocalhost);
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
