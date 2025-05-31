import type { UserConfig } from 'vite';

import {
  getModuleFederationTargets,
  rewriteDistToSrc,
} from '@baseplate-dev/project-builder-lib/plugin-tools';
import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(async (): Promise<UserConfig> => {
  const viteTargets = await getModuleFederationTargets(__dirname, {
    rewritePluginDirectory: rewriteDistToSrc,
  });
  return {
    build: {
      outDir: 'dist/web',
      sourcemap: true,
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        external: ['@baseplate-dev/project-builder-lib'],
      },
    },
    plugins: [
      srcSubpathImportPlugin(import.meta.dirname),
      federation({
        name: 'baseplate-plugin-storage',
        filename: 'remoteEntry.js',
        exposes: viteTargets,
        shared: {
          react: {},
          'react-dom': {},
          zod: {},
          '@baseplate-dev/project-builder-lib': {
            version: '*',
          },
          '@baseplate-dev/project-builder-lib/web': {
            version: '*',
          },
          '@baseplate-dev/ui-components': { version: '*' },
        },
      }),
      react(),
      tailwindcss(),
    ],
  };
});
