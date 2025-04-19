import type {
  TypescriptCodeExpression,
  TypescriptSourceFile,
} from '@halfdomelabs/core-generators';

import {
  createTypescriptTemplateConfig,
  eslintProvider,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  projectProvider,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderTask,
  createProviderType,
  renderRawTemplateFileAction,
  renderTextTemplateGroupAction,
} from '@halfdomelabs/sync';
import { quot } from '@halfdomelabs/utils';
import { z } from 'zod';

import { CORE_REACT_RAW_TEMPLATES } from './generated/raw-templates.js';
import { CORE_REACT_TEXT_TEMPLATES } from './generated/text-templates.js';
import { viteNodeTask } from './node.js';

const descriptorSchema = z.object({
  title: z.string().default('React App'),
  description: z.string().default('A React app'),
});

const INDEX_FILE_CONFIG = createTypescriptTemplateConfig({
  APP: { type: 'code-expression', default: '<div />' },
  IMPORTS: { type: 'code-block' },
  HEADER: { type: 'code-block' },
});

export interface ReactProvider {
  getIndexFile(): TypescriptSourceFile<typeof INDEX_FILE_CONFIG>;
  addVitePlugin(plugin: TypescriptCodeExpression): void;
  addServerOption(key: string, value: TypescriptCodeExpression): void;
}

export const reactProvider = createProviderType<ReactProvider>('react');

export const reactGenerator = createGenerator({
  name: 'core/react',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    setupNode: createGeneratorTask({
      dependencies: {
        nodeConfig: nodeConfigProvider,
      },
      run: ({ nodeConfig }, { taskId }) => {
        nodeConfig.isEsm.set(true, taskId);
        return {};
      },
    }),
    viteNode: viteNodeTask,
    gitIgnore: createProviderTask(nodeGitIgnoreProvider, (nodeGitIgnore) => {
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
    }),
    eslint: createProviderTask(eslintProvider, (eslint) => {
      eslint.getConfig().set('react', true).set('disableVitest', true);
    }),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        project: projectProvider,
      },
      exports: {
        react: reactProvider.export(projectScope),
      },
      run({ typescript, project }) {
        const indexFile = typescript.createTemplate(INDEX_FILE_CONFIG);

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
            await builder.apply(
              renderRawTemplateFileAction({
                template: CORE_REACT_RAW_TEMPLATES.favicon,
                destination: 'public/favicon.ico',
              }),
            );

            await builder.apply(
              renderTextTemplateGroupAction({
                group: CORE_REACT_TEXT_TEMPLATES.staticGroup,
                baseDirectory: '',
                variables: {
                  readme: {
                    TPL_PROJECT_NAME: project.getProjectName(),
                  },
                  indexHtml: {
                    TPL_TITLE: descriptor.title,
                    TPL_DESCRIPTION: descriptor.description,
                  },
                },
              }),
            );

            await builder.apply(
              indexFile.renderToAction('src/index.tsx', 'src/index.tsx'),
            );

            const viteConfig = typescript.createTemplate({
              CONFIG: TypescriptCodeUtils.mergeExpressionsAsObject({
                plugins:
                  TypescriptCodeUtils.mergeExpressionsAsArray(vitePlugins),
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
    }),
  }),
});
