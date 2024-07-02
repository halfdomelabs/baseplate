/* eslint-disable no-console */
import { getModuleFederationTargets } from '@halfdomelabs/project-builder-lib/plugin-tools';
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { UserConfig, defineConfig } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';

const viteTargets = await getModuleFederationTargets(__dirname);

export default defineConfig((): UserConfig => {
  return {
    build: {
      outDir: 'dist/web',
      sourcemap: true,
      modulePreload: false,
      target: 'esnext',
      minify: false,
      cssCodeSplit: false,
      rollupOptions: {
        external: ['@halfdomelabs/project-builder-lib'],
      },
    },
    plugins: [
      viteTsconfigPaths(),
      federation({
        name: 'baseplate-plugin-storage',
        filename: 'remoteEntry.js',
        exposes: viteTargets,
        shared: {
          react: {},
          'react-dom': {},
          zod: {},
          '@halfdomelabs/project-builder-lib': {
            version: '*',
          },
          '@halfdomelabs/project-builder-lib/web': {
            version: '*',
          },
          '@halfdomelabs/ui-components': { version: '*' },
        },
      }),
      react(),
    ],
  };
});
