import type {
  TsCodeFragment,
  TsTemplateOutputTemplateMetadata,
} from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  eslintConfigProvider,
  extractPackageVersions,
  packageScope,
  pathRootsProvider,
  prettierProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

import { reactAppConfigProvider } from '../react-app/index.js';
import { reactBaseConfigProvider } from '../react/react.generator.js';
import { CORE_REACT_ROUTER_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  renderPlaceholderIndex: z.boolean().default(false),
});

const [setupTask, reactRouterConfigProvider, reactRouterConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      renderHeaders: t.map<string, TsCodeFragment>(),
      rootLayoutComponent: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'react-router',
      configScope: packageScope,
    },
  );

export { reactRouterConfigProvider };

export const reactRouterGenerator = createGenerator({
  name: 'core/react-router',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ renderPlaceholderIndex }) => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@tanstack/react-router']),
      dev: extractPackageVersions(REACT_PACKAGES, ['@tanstack/router-plugin']),
    }),
    paths: CORE_REACT_ROUTER_GENERATED.paths.task,
    imports: CORE_REACT_ROUTER_GENERATED.imports.task,
    renderers: CORE_REACT_ROUTER_GENERATED.renderers.task,
    vite: createProviderTask(reactBaseConfigProvider, (reactBaseConfig) => {
      reactBaseConfig.vitePlugins.set(
        '@tanstack/router-plugin',
        tsTemplate`${TsCodeUtils.importFragment(
          'tanstackRouter',
          '@tanstack/router-plugin/vite',
        )}({
        target: 'react',
        autoCodeSplitting: true,
        generatedRouteTree: './src/route-tree.gen.ts',
        quoteStyle: 'single',
      })`,
      );
    }),
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: CORE_REACT_ROUTER_GENERATED.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.renderRoot.set(
          tsCodeFragment(
            '<AppRoutes />',
            tsImportBuilder(['AppRoutes']).from(paths.appRoutes),
          ),
        );
      },
    }),
    prettier: createProviderTask(prettierProvider, (prettier) => {
      prettier.addPrettierIgnore('/src/route-tree.gen.ts');
    }),
    eslint: createProviderTask(eslintConfigProvider, (eslint) => {
      eslint.eslintIgnore.push('src/route-tree.gen.ts');
    }),
    routes: createGeneratorTask({
      dependencies: {
        pathRoots: pathRootsProvider,
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(packageScope),
      },
      run({ pathRoots }) {
        const directoryBase = `@/src/routes`;

        pathRoots.registerPathRoot('routes-root', directoryBase);

        return {
          providers: {
            reactRoutes: {
              getOutputRelativePath: () => directoryBase,
              getRoutePrefix: () => '',
              getRouteFilePath: () => '',
            },
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfigValues: reactRouterConfigValuesProvider,
        renderers: CORE_REACT_ROUTER_GENERATED.renderers.provider,
      },
      run({
        reactRouterConfigValues: { renderHeaders, rootLayoutComponent },
        renderers,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              renderers.appRoutes.render({
                variables: {
                  TPL_RENDER_HEADER: TsCodeUtils.mergeFragments(renderHeaders),
                },
              }),
            );

            await builder.apply(
              renderers.rootRoute.render({
                variables: {
                  TPL_ROOT_ROUTE_OPTIONS: TsCodeUtils.mergeFragmentsAsObject({
                    component: rootLayoutComponent,
                  }),
                },
              }),
            );

            if (renderPlaceholderIndex) {
              await builder.apply(renderers.placeholderIndex.render({}));
            }

            // Write a pseudo-file so that the template extractor can infer metadata for the
            // generated route tree file
            builder.writeFile({
              id: 'route-tree',
              destination: '@/src/route-tree.gen.ts',
              contents: '',
              options: { skipWriting: true },
              templateMetadata: {
                generator: builder.generatorInfo.name,
                name: 'route-tree',
                projectExportsOnly: true,
                type: 'ts',
                fileOptions: { kind: 'singleton' },
              } satisfies TsTemplateOutputTemplateMetadata,
            });
          },
        };
      },
    }),
  }),
});
