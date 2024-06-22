/* eslint-disable no-console */
import federation from '@originjs/vite-plugin-federation';
import react from '@vitejs/plugin-react';
import { globbySync } from 'globby';
import fs from 'node:fs';
import path from 'node:path';
import { UserConfig, defineConfig } from 'vite';
import viteTsconfigPaths from 'vite-tsconfig-paths';
import z from 'zod';

const metadataJsonSchema = z.object({
  /**
   * The name of the plugin
   */
  name: z.string(),
});

function readMetadataJson(
  directory: string,
): z.TypeOf<typeof metadataJsonSchema> | undefined {
  const metadataJsonFilename = path.join(directory, 'metadata.json');
  try {
    if (!fs.existsSync(metadataJsonFilename)) {
      return;
    }
    const metadataContents = fs.readFileSync(metadataJsonFilename, 'utf-8');
    return metadataJsonSchema.parse(JSON.parse(metadataContents));
  } catch (err) {
    console.error(`Error reading plugin metadata ${metadataJsonFilename}`);
    throw err;
  }
}

function loadViteTargets(pluginSrc: string[]): Record<string, string> {
  const pluginDirectories = globbySync(pluginSrc, {
    cwd: __dirname,
    onlyDirectories: true,
  });

  if (!pluginDirectories.length) {
    throw new Error('No plugin directories found');
  }

  const pluginTargets = pluginDirectories.map(
    (pluginDirectory): Record<string, string>[] => {
      // look for metadata.json
      const { name: pluginName } = readMetadataJson(pluginDirectory) ?? {};

      if (!pluginName) {
        return [];
      }

      const createEntryWithAlias = (name: string): Record<string, string> => ({
        [`${pluginName}/${name}`]: `${pluginDirectory}/${name}.ts`,
      });

      return [createEntryWithAlias('web'), createEntryWithAlias('common')];
    },
  );

  return Object.assign({}, ...pluginTargets.flat()) as Record<string, string>;
}

const viteTargets = loadViteTargets(['src/*']);

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
        },
      }),
      react(),
    ],
  };
});
