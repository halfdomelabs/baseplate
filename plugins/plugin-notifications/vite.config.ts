import type { UserConfig } from 'vite';

import { getModuleFederationTargets } from '@baseplate-dev/project-builder-lib/plugin-tools';
import { srcSubpathImportPlugin } from '@baseplate-dev/tools/src-subpath-import-plugin';
import { federation } from '@module-federation/vite';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig(async (): Promise<UserConfig> => {
  const viteTargets = await getModuleFederationTargets(__dirname, {
    overridePluginGlobs: ['src/*/plugin.json'],
  });
  return {
    base: './',
    build: {
      outDir: 'dist/web',
      sourcemap: true,
      modulePreload: false,
      target: 'esnext',
      minify: false,
    },
    plugins: [
      srcSubpathImportPlugin(import.meta.dirname),
      federation({
        name: 'plugin-notifications',
        filename: 'remoteEntry.js',
        exposes: viteTargets,
        dts: false,
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
          zod: { singleton: true },
          '@baseplate-dev/project-builder-lib': { singleton: true },
          '@baseplate-dev/project-builder-lib/web': { singleton: true },
          '@baseplate-dev/ui-components': { singleton: true },
          '@tanstack/react-router': { singleton: true },
        },
      }),
      react(),
      tailwindcss(),
    ],
  };
});
