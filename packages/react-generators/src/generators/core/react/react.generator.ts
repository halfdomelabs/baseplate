import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  eslintConfigProvider,
  nodeConfigProvider,
  nodeGitIgnoreProvider,
  packageInfoProvider,
  packageScope,
  renderRawTemplateFileAction,
  renderTextTemplateGroupAction,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { CORE_REACT_GENERATED } from './generated/index.js';
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
      configScope: packageScope,
    },
  );

export { reactBaseConfigProvider };

export const reactGenerator = createGenerator({
  name: 'core/react',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    setup: setupTask,
    paths: CORE_REACT_GENERATED.paths.task,
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
    eslintConfig: createProviderTask(eslintConfigProvider, (eslintConfig) => {
      eslintConfig.react.set(true);
      eslintConfig.disableVitest.set(true);
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
            'envVars.PORT ? Number.parseInt(envVars.PORT, 10) : 3000',
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
        packageInfo: packageInfoProvider,
        reactConfigValues: reactConfigValuesProvider,
        paths: CORE_REACT_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        packageInfo,
        reactConfigValues: {
          appFragment,
          headerFragments,
          vitePlugins,
          viteServerOptions,
        },
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderRawTemplateFileAction({
                template: CORE_REACT_GENERATED.templates.favicon,
                destination: paths.favicon,
              }),
            );

            // render README and index.html
            await builder.apply(
              renderTextTemplateGroupAction({
                group: CORE_REACT_GENERATED.templates.staticGroup,
                paths,
                variables: {
                  readme: {
                    TPL_PROJECT_NAME: packageInfo.getPackageName(),
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
                template: CORE_REACT_GENERATED.templates.index,
                destination: paths.index,
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
                template: CORE_REACT_GENERATED.templates.viteConfig,
                destination: paths.viteConfig,
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
