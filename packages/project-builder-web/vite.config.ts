import type { ClientRequest } from 'node:http';

import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';

import { pluginDevServerPlugin } from './plugins/plugin-dev-server.js';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env from current directory and parent directories
  const localEnv = loadEnv(mode, process.cwd(), '');
  const rootEnv = loadEnv(mode, '../../', '');
  const envVars = { ...process.env, ...rootEnv, ...localEnv };

  // Apply PORT_OFFSET if set
  const portOffset = envVars.PORT_OFFSET
    ? Number.parseInt(envVars.PORT_OFFSET, 10)
    : 0;
  const basePort = envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 4300;
  const PORT = basePort + portOffset;

  // Apply offset to backend host if it's a localhost URL
  let backendHost = envVars.DEV_BACKEND_HOST;
  if (backendHost && portOffset !== 0) {
    // Parse and update the port in the backend host URL
    const backendUrl = new URL(backendHost);
    if (
      backendUrl.hostname === 'localhost' ||
      backendUrl.hostname === '127.0.0.1'
    ) {
      const baseBackendPort = Number.parseInt(backendUrl.port, 10);
      backendUrl.port = String(baseBackendPort + portOffset);
      backendHost = backendUrl.toString().replace(/\/$/, ''); // Remove trailing slash
    }
  }

  return {
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        generatedRouteTree: './src/route-tree.gen.ts',
        quoteStyle: 'single',
      }),
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
          '@baseplate-dev/utils': { version: '*' },
          '@tanstack/react-router': { version: '*' },
        },
      }),
      pluginDevServerPlugin(),
      tailwindcss(),
    ],
    server: {
      port: PORT,
      proxy: backendHost
        ? {
            '/api': {
              target: backendHost,
              changeOrigin: true,
              ws: true,
            },
            '/trpc': {
              target: backendHost,
              changeOrigin: true,
              ws: true,
              configure: (proxy) => {
                const rewriteOriginIfLocalhost = (
                  proxyReq: ClientRequest,
                ): void => {
                  const origin = proxyReq.getHeader('origin');

                  // Regex for this dev server instance URLs
                  const devServerRegex = new RegExp(
                    String.raw`^(http|https|ws|wss)://(localhost|127.0.0.1|\[::1\]):${PORT}$`,
                  );

                  // Rewrite localhost origin to match backend host only if it comes from the Vite dev server
                  if (
                    typeof origin === 'string' &&
                    backendHost &&
                    devServerRegex.test(origin)
                  ) {
                    proxyReq.setHeader('origin', backendHost);
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
