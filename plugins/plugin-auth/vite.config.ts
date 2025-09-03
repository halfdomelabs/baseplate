import type { UserConfig } from 'vite';

import { getModuleFederationTargets } from '@baseplate-dev/project-builder-lib/plugin-tools';
import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import federation from '@originjs/vite-plugin-federation';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(async (): Promise<UserConfig> => {
  const viteTargets = await getModuleFederationTargets(__dirname, {
    overridePluginGlobs: ['src/*/plugin.json'],
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
        name: 'plugin-auth',
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
          '@baseplate-dev/utils': { version: '*' },
          '@baseplate-dev/ui-components': { version: '*' },
          '@tanstack/react-router': { version: '*' },
        },
      }),
      react(),
      tailwindcss(),
    ],
  };
});
