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
  createProviderType,
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

/**
 * A field in the root route context.
 */
export interface RootRouteContextField {
  /** The name of the field */
  name: string;
  /** The type of the field */
  type: TsCodeFragment;
  /** Whether the field is optional */
  optional: boolean;
  /** The code to initialize the field in the createRouter function */
  createRouteInitializer?: TsCodeFragment;
  /** The code to initialize the field in the RouterProvider */
  routerProviderInitializer?: TsCodeFragment;
}

const [setupTask, reactRouterConfigProvider, reactRouterConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      /* The code to set up the component that will be placed in the render function of the router component (no conditional logic, hooks only) */
      routerSetupFragments: t.map<string, TsCodeFragment>(),
      /* The code to set up the component that will be placed in the body of the router component (conditional logic, no hooks) */
      routerBodyFragments: t.map<string, TsCodeFragment>(),
      /* The component that contains the root layout, e.g. <RootLayout /> */
      rootLayoutComponent: t.scalar<TsCodeFragment>(),
      /* The fields in the root route context */
      rootContextFields: t.namedArray<RootRouteContextField>(),
    }),
    {
      prefix: 'react-router',
      configScope: packageScope,
    },
  );

export { reactRouterConfigProvider };

export interface ReactRouterProvider {
  getRootRouteDirectory(): string;
}

export const reactRouterProvider =
  createProviderType<ReactRouterProvider>('react-router');

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
        reactRouter: reactRouterProvider.export(packageScope),
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
            reactRouter: {
              getRootRouteDirectory: () => directoryBase,
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
        reactRouterConfigValues: {
          routerSetupFragments,
          routerBodyFragments,
          rootLayoutComponent,
          rootContextFields,
        },
        renderers,
      }) {
        const fieldMissingInitializer = rootContextFields.filter(
          (field) =>
            !field.createRouteInitializer &&
            !field.routerProviderInitializer &&
            !field.optional,
        );

        if (fieldMissingInitializer.length > 0) {
          throw new Error(
            `The following route root context fields are missing an initializer: ${fieldMissingInitializer.map((field) => field.name).join(', ')}`,
          );
        }

        const sortedRootContextFields = rootContextFields.toSorted((a, b) =>
          a.name.localeCompare(b.name),
        );

        return {
          build: async (builder) => {
            const routerProvider = TsCodeUtils.importFragment(
              'RouterProvider',
              '@tanstack/react-router',
            );
            const routeProviderInitializers = new Map(
              sortedRootContextFields
                .filter((f) => f.routerProviderInitializer)
                .map((field) => [field.name, field.routerProviderInitializer]),
            );

            await builder.apply(
              renderers.appRoutes.render({
                variables: {
                  TPL_ADDITIONAL_ROUTER_OPTIONS:
                    rootContextFields.length > 0
                      ? tsTemplate`
                    context: {
                      ${TsCodeUtils.mergeFragmentsPresorted(
                        sortedRootContextFields
                          .filter(
                            (f) => !f.optional || f.createRouteInitializer,
                          )
                          .map((field) =>
                            field.createRouteInitializer
                              ? tsTemplate`${field.name}: ${field.createRouteInitializer},`
                              : `// eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- context instantiated in the RouteProvider
                           ${field.name}: undefined!,`,
                          ),
                      )}
                    }
                  `
                      : '',
                  TPL_COMPONENT_SETUP:
                    TsCodeUtils.mergeFragments(routerSetupFragments),
                  TPL_COMPONENT_BODY:
                    TsCodeUtils.mergeFragments(routerBodyFragments),
                  TPL_ROUTER_PROVIDER: tsTemplate`<${routerProvider} router={router} ${
                    routeProviderInitializers.size > 0
                      ? tsTemplate`context={${TsCodeUtils.mergeFragmentsAsObject(
                          routeProviderInitializers,
                        )}}`
                      : ''
                  } />`,
                },
              }),
            );

            await builder.apply(
              renderers.rootRoute.render({
                variables: {
                  TPL_ROOT_ROUTE_CONTEXT:
                    rootContextFields.length > 0
                      ? TsCodeUtils.mergeFragmentsAsInterfaceContent(
                          new Map(
                            sortedRootContextFields.map((field) => [
                              field.optional ? `${field.name}?` : field.name,
                              field.type,
                            ]),
                          ),
                        )
                      : 'placeholder?: string',
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
