import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import svgrPlugin from 'vite-plugin-svgr';
import viteTsconfigPaths from 'vite-tsconfig-paths';

import { pluginDevServerPlugin } from './plugins/plugin-dev-server';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const envVars = { ...process.env, ...loadEnv(mode, process.cwd(), '') };

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
      port: envVars.PORT ? parseInt(envVars.PORT, 10) : 3000,
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
