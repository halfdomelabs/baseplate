import type {
  TypescriptCodeExpression,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptTemplateConfig,
  eslintProvider,
  nodeGitIgnoreProvider,
  nodeProvider,
  nodeSetupProvider,
  projectScope,
  quot,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
  createTaskConfigBuilder,
  writeTemplateAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { setupViteNode } from './node.js';

const descriptorSchema = z.object({
  title: z.string().default('React App'),
  description: z.string().default('A React app'),
});

type Descriptor = z.infer<typeof descriptorSchema>;

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

const createMainTask = createTaskConfigBuilder((descriptor: Descriptor) => ({
  name: 'main',

  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
    eslint: eslintProvider.dependency().optional(),
  },

  exports: {
    react: reactProvider.export(projectScope),
  },

  run({ node, typescript, nodeGitIgnore, eslint }) {
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
          ignored: ['**/baseplate/**'],
        }),
      ),
    });

    return {
      providers: {
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
      },
      build: async (builder) => {
        const initialFiles = ['public/favicon.ico', 'README.md'];

        await Promise.all(
          initialFiles.map((file) =>
            copyFileAction({
              source: file,
              destination: file,
              shouldNeverOverwrite: true,
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
}));

export const reactGenerator = createGenerator({
  name: 'core/react',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'setup-node',
      dependencies: {
        nodeSetup: nodeSetupProvider,
      },
      run: ({ nodeSetup }) => {
        nodeSetup.setIsEsm(true);
        return {};
      },
    });
    taskBuilder.addTask(createMainTask(descriptor));
  },
});
