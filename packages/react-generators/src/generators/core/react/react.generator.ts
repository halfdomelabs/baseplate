import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  eslintProvider,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  projectProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  renderRawTemplateFileAction,
  renderTextTemplateGroupAction,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { CORE_REACT_RAW_TEMPLATES } from './generated/raw-templates.js';
import { CORE_REACT_TEXT_TEMPLATES } from './generated/text-templates.js';
import { CORE_REACT_TS_TEMPLATES } from './generated/ts-templates.js';
import { viteNodeTask } from './node.js';

const descriptorSchema = z.object({
  title: z.string().default('React App'),
  description: z.string().default('A React app'),
});

const [setupTask, reactBaseConfigProvider, reactConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      appFragment: t.scalar<TsCodeFragment>(),
      headerFragments: t.map<string, TsCodeFragment>(),
      vitePlugins: t.map<string, TsCodeFragment>(),
      viteServerOptions: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'react',
      configScope: projectScope,
    },
  );

export { reactBaseConfigProvider };

export const reactGenerator = createGenerator({
  name: 'core/react',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    setup: setupTask,
    setupNode: createProviderTask(nodeConfigProvider, (nodeConfig) => {
      nodeConfig.isEsm.set(true);
    }),
    viteNode: viteNodeTask,
    gitIgnore: createProviderTask(nodeGitIgnoreProvider, (nodeGitIgnore) => {
      nodeGitIgnore.exclusions.set('react', [
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
    defaultConfig: createProviderTask(
      reactBaseConfigProvider,
      (reactConfig) => {
        // Add default plugins
        reactConfig.vitePlugins.mergeObj({
          react: tsCodeFragment(
            `react()`,
            tsImportBuilder().default('react').from('@vitejs/plugin-react'),
          ),
          'tsconfig-paths': tsCodeFragment(
            `viteTsconfigPaths()`,
            tsImportBuilder()
              .default('viteTsconfigPaths')
              .from('vite-tsconfig-paths'),
          ),
          svgr: tsCodeFragment(
            `svgrPlugin()`,
            tsImportBuilder().default('svgrPlugin').from('vite-plugin-svgr'),
          ),
        });

        // Add default server options
        reactConfig.viteServerOptions.mergeObj({
          port: tsCodeFragment(
            'envVars.PORT ? parseInt(envVars.PORT, 10) : 3000',
          ),
          watch: tsCodeFragment(
            JSON.stringify({
              ignored: ['**/baseplate/**'],
            }),
          ),
        });
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        project: projectProvider,
        reactConfigValues: reactConfigValuesProvider,
      },
      run({
        typescriptFile,
        project,
        reactConfigValues: {
          appFragment,
          headerFragments,
          vitePlugins,
          viteServerOptions,
        },
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderRawTemplateFileAction({
                template: CORE_REACT_RAW_TEMPLATES.favicon,
                destination: 'public/favicon.ico',
              }),
            );

            // render README and index.html
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
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TS_TEMPLATES.index,
                destination: 'src/index.tsx',
                variables: {
                  TPL_APP: appFragment ?? '<div />',
                  TPL_HEADER: TsCodeUtils.mergeFragments(
                    headerFragments,
                    '\n\n',
                  ),
                },
              }),
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_TS_TEMPLATES.viteConfig,
                destination: 'vite.config.ts',
                variables: {
                  TPL_CONFIG: TsCodeUtils.mergeFragmentsAsObject({
                    plugins: TsCodeUtils.mergeFragmentsAsArray(vitePlugins),
                    server:
                      TsCodeUtils.mergeFragmentsAsObject(viteServerOptions),
                    build: JSON.stringify({
                      outDir: 'build',
                    }),
                  }),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
