import type {
  TsCodeFragment,
  TsTemplateOutputTemplateMetadata,
} from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  pathRootsProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  tsTemplate,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createReadOnlyProviderType,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import type { ReactRoute, ReactRouteLayout } from '#src/providers/routes.js';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { reactRoutesProvider } from '#src/providers/routes.js';

import { renderRoutes } from '../_utils/render-routes.js';
import { reactAppConfigProvider } from '../react-app/index.js';
import { reactBaseConfigProvider } from '../react/react.generator.js';
import { CORE_REACT_ROUTER_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [setupTask, reactRouterConfigProvider, reactRouterConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      renderHeaders: t.map<string, TsCodeFragment>(),
      routesComponent: t.scalar<TsCodeFragment>(),
    }),
    {
      prefix: 'react-router',
      configScope: packageScope,
    },
  );

export { reactRouterConfigProvider };

const reactRouteValuesProvider = createReadOnlyProviderType<{
  routes: ReactRoute[];
  layouts: ReactRouteLayout[];
}>('react-route-values');

export const reactRouterGenerator = createGenerator({
  name: 'core/react-router',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@tanstack/react-router',
        'react-router-dom',
      ]),
      dev: extractPackageVersions(REACT_PACKAGES, ['@tanstack/router-plugin']),
    }),
    paths: CORE_REACT_ROUTER_GENERATED.paths.task,
    imports: CORE_REACT_ROUTER_GENERATED.imports.task,
    renderers: CORE_REACT_ROUTER_GENERATED.renderers.task,
    vite: createProviderTask(reactBaseConfigProvider, (reactBaseConfig) => {
      // TODO [2025-07-03]: Re-enable logging once migration is complete
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
        disableLogging: true,
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
    routes: createGeneratorTask({
      dependencies: {
        pathRoots: pathRootsProvider,
      },
      exports: {
        reactRoutes: reactRoutesProvider.export(packageScope),
        reactRouteValuesProvider: reactRouteValuesProvider.export(),
      },
      run({ pathRoots }) {
        const routes: ReactRoute[] = [];
        const layouts: ReactRouteLayout[] = [];

        const directoryBase = `@/src/routes`;

        pathRoots.registerPathRoot('routes-root', directoryBase);

        return {
          providers: {
            reactRoutes: {
              registerRoute(route) {
                routes.push(route);
              },
              registerLayout(layout) {
                layouts.push(layout);
              },
              getDirectoryBase: () => directoryBase,
              getRoutePrefix: () => ``,
            },
            reactRouteValuesProvider: {
              routes,
              layouts,
            },
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactRouterConfigValues: reactRouterConfigValuesProvider,
        reactRouteValues: reactRouteValuesProvider,
        typescriptFile: typescriptFileProvider,
        paths: CORE_REACT_ROUTER_GENERATED.paths.provider,
        renderers: CORE_REACT_ROUTER_GENERATED.renderers.provider,
      },
      run({
        reactRouterConfigValues: {
          routesComponent = tsCodeFragment(
            'Routes',
            tsImportBuilder(['Routes']).from('react-router-dom'),
          ),
          renderHeaders,
        },
        reactRouteValues: { routes, layouts },
        typescriptFile,
        paths,
        renderers,
      }) {
        return {
          build: async (builder) => {
            // TODO: Make sure we don't have more than one layout key

            // group routes by layout key
            const renderedRoutes = renderRoutes(routes, layouts);

            await builder.apply(
              renderers.appRoutes.render({
                variables: {
                  TPL_RENDER_HEADER: TsCodeUtils.mergeFragments(renderHeaders),
                },
              }),
            );

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
