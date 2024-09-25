import {
  createTypescriptTemplateConfig,
  eslintProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  quot,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithChildren,
  copyFileAction,
  writeTemplateAction,
  createProviderType,
  createNonOverwriteableMap,
  InferGeneratorDescriptor,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { setupViteNode } from './node.js';

const descriptorSchema = z.object({
  title: z.string().default('React App'),
  description: z.string().default('A React app'),
});

export type ReactGeneratorDescriptor = InferGeneratorDescriptor<
  typeof descriptorSchema
>;

const INDEX_FILE_CONFIG = createTypescriptTemplateConfig({
  APP: { type: 'code-expression', default: '<div />' },
  IMPORTS: { type: 'code-block' },
  HEADER: { type: 'code-block' },
});

export interface ReactProvider {
  getSrcFolder(): string;
  getIndexFile(): TypescriptSourceFile<typeof INDEX_FILE_CONFIG>;
  addVitePlugin(plugin: TypescriptCodeExpression): void;
  addServerOption(key: string, value: TypescriptCodeExpression): void;
}

export const reactProvider = createProviderType<ReactProvider>('react');

const ReactGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
    eslint: eslintProvider.dependency().optional(),
  },
  exports: {
    react: reactProvider,
  },
  getDefaultChildGenerators: () => ({
    typescript: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-typescript',
      },
    },
    app: {
      provider: 'react-app',
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-app',
        peerProvider: true,
      },
    },
    router: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-router',
        peerProvider: true,
      },
    },
    logger: {
      provider: 'react-logger',
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-logger',
        peerProvider: true,
      },
    },
    components: {
      provider: 'react-components',
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-components',
        peerProvider: true,
      },
    },
    config: {
      provider: 'react-config',
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-config',
        peerProvider: true,
      },
    },
    proxy: {
      defaultToNullIfEmpty: true,
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-proxy',
        peerProvider: true,
      },
    },
    error: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-error',
        peerProvider: true,
      },
    },
    utils: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-utils',
        peerProvider: true,
      },
    },
    errorBoundary: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/core/react-error-boundary',
        peerProvider: true,
      },
    },
  }),
  createGenerator(descriptor, { node, typescript, nodeGitIgnore, eslint }) {
    const indexFile = typescript.createTemplate(INDEX_FILE_CONFIG);
    setupViteNode(node);

    nodeGitIgnore.addExclusions([
      '# production',
      '/build',
      '',
      '# misc',
      '.DS_Store',
      '.env.local',
      '.env.development.local',
      '.env.test.local',
      '.env.production.local',
    ]);

    eslint?.getConfig().set('react', true).set('disableVitest', true);

    const vitePlugins: TypescriptCodeExpression[] = [
      TypescriptCodeUtils.createExpression(
        `react()`,
        `import react from '@vitejs/plugin-react';`,
      ),
      TypescriptCodeUtils.createExpression(
        `viteTsconfigPaths()`,
        `import viteTsconfigPaths from 'vite-tsconfig-paths';`,
      ),
      TypescriptCodeUtils.createExpression(
        `svgrPlugin()`,
        `import svgrPlugin from 'vite-plugin-svgr';`,
      ),
    ];

    const viteServerOptions = createNonOverwriteableMap<
      Record<string, TypescriptCodeExpression>
    >({
      port: TypescriptCodeUtils.createExpression(
        'envVars.PORT ? parseInt(envVars.PORT, 10) : 3000',
      ),
      watch: TypescriptCodeUtils.createExpression(
        JSON.stringify({
          ignored: ['**/baseplate/.clean/**', '**/baseplate/.clean_tmp/**'],
        }),
      ),
    });

    return {
      getProviders: () => ({
        react: {
          getSrcFolder() {
            return 'src';
          },
          getIndexFile() {
            return indexFile;
          },
          addVitePlugin(plugin) {
            vitePlugins.push(plugin);
          },
          addServerOption(key, value) {
            viteServerOptions.set(key, value);
          },
        },
      }),
      build: async (builder) => {
        const initialFiles = ['public/favicon.ico', 'README.md'];

        await Promise.all(
          initialFiles.map((file) =>
            copyFileAction({
              source: file,
              destination: file,
              neverOverwrite: true,
            }),
          ),
        );

        const staticFiles = ['src/vite-env.d.ts'];

        await Promise.all(
          staticFiles.map((file) =>
            builder.apply(
              copyFileAction({
                source: file,
                destination: file,
                shouldFormat: true,
              }),
            ),
          ),
        );

        await builder.apply(
          indexFile.renderToAction('src/index.tsx', 'src/index.tsx'),
        );

        await builder.apply(
          writeTemplateAction({
            template: 'index.html.ejs',
            destination: 'index.html',
            data: {
              title: descriptor.title,
              description: descriptor.description,
            },
          }),
        );

        const viteConfig = typescript.createTemplate({
          CONFIG: TypescriptCodeUtils.mergeExpressionsAsObject({
            plugins: TypescriptCodeUtils.mergeExpressionsAsArray(vitePlugins),
            server: TypescriptCodeUtils.mergeExpressionsAsObject(
              viteServerOptions.value(),
            ),
            build: TypescriptCodeUtils.mergeExpressionsAsObject({
              outDir: quot('build'),
            }),
          }),
        });

        await builder.apply(viteConfig.renderToAction('vite.config.ts'));
      },
    };
  },
});

export default ReactGenerator;
