import type {
  TsCodeFragment,
  TsImportDeclaration,
} from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  createNodeTask,
  eslintConfigProvider,
  extractPackageVersions,
  packageScope,
  prettierProvider,
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsImportBuilder,
  tsTemplate,
  tsTemplateWithImports,
  tsTypeImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
  POST_WRITE_COMMAND_PRIORITY,
} from '@baseplate-dev/sync';
import { notEmpty, quot, toposortLocal } from '@baseplate-dev/utils';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { reactTypescriptProvider } from '#src/generators/core/index.js';
import { reactAppConfigProvider } from '#src/generators/core/react-app/index.js';
import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '#src/generators/core/react-config/index.js';
import { reactErrorConfigProvider } from '#src/generators/core/react-error/index.js';
import { reactProxyProvider } from '#src/generators/core/react-proxy/index.js';
import { reactRouterConfigProvider } from '#src/generators/core/react-router/index.js';

import { APOLLO_REACT_APOLLO_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  /**
   * URL for the GraphQL API endpoint for use in development, e.g. /api/graphql
   */
  devApiEndpoint: z.string().min(1),
  /**
   * Location to get the GraphQL schema relative to the app root, e.g. ../backend/schema.graphql
   */
  schemaLocation: z.string().min(1),
  /**
   * Whether to enable GraphQL subscriptions
   */
  enableSubscriptions: z.boolean().optional(),
});

/**
 * Argument for the createApolloClient function with various
 * hooks to get the appropriate values
 *
 * @example
 * ```ts
 * // In app/AppApolloProvider.tsx
 * function AppApolloProvider() {
 *   REACT_RENDER_BODY;
 *
 *   const client = useMemo(
 *     () => createApolloClient({ NAME }),
 *     [NAME],
 *   );
 * }
 *
 * // In services/apollo/index.ts
 *
 * function createApolloClient({ NAME }: { NAME: TYPE }) {
 *   ...
 * }
 * ```
 */
export interface ApolloCreateArgument {
  /**
   * Name of the argument
   */
  name: string;
  /**
   * Type of the argument
   */
  type: TsCodeFragment | string;
  /**
   * Fragment to add to the React render function for the Apollo Provider
   *
   * This should add the name of the argument to the scope to be used in the
   * createApolloClient function.
   */
  reactRenderBody: TsCodeFragment;
}

const APOLLO_LINK_PRIORITY = {
  error: 1,
  auth: 2,
  network: 3,
};

type ApolloLinkPriority = keyof typeof APOLLO_LINK_PRIORITY;

/**
 * Link for the ApolloClient
 */
export interface ApolloLink {
  /**
   * Name of the link
   */
  name: string;
  /**
   * Import of the link if not declared in the bodyFragment
   */
  nameImport?: TsImportDeclaration;
  /**
   * Priority of the link
   */
  priority: ApolloLinkPriority;
  /**
   * Fragment to add the body of the createApolloClient function.
   *
   * This should add the name of the link to the function scope.
   */
  bodyFragment?: TsCodeFragment;
  /**
   * The name of any links this link depends on.
   */
  dependencies?: string[];
  /**
   * Which network transport this link applies to.
   *
   * @default 'all'
   */
  transport?: 'http' | 'ws' | 'all';
}

const [setupTask, reactApolloConfigProvider, reactApolloConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      createApolloClientArguments: t.namedArray<ApolloCreateArgument>(),
      apolloLinks: t.namedArray<ApolloLink>(),
      websocketOptions: t.map<string, TsCodeFragment | string>(),
    }),
    {
      prefix: 'react-apollo',
      configScope: packageScope,
    },
  );

export { reactApolloConfigProvider };

export interface ReactApolloProvider {
  /**
   * Get the path to the generated graphql file
   *
   * @returns The path to the generated graphql file
   */
  getGeneratedFilePath(): string;
}

export const reactApolloProvider =
  createProviderType<ReactApolloProvider>('react-apollo');

export const reactApolloGenerator = createGenerator({
  name: 'apollo/react-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ devApiEndpoint, schemaLocation, enableSubscriptions }) => ({
    paths: APOLLO_REACT_APOLLO_GENERATED.paths.task,
    imports: APOLLO_REACT_APOLLO_GENERATED.imports.task,
    renderers: APOLLO_REACT_APOLLO_GENERATED.renderers.task,
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@apollo/client',
        'graphql',
      ]),
      dev: extractPackageVersions(REACT_PACKAGES, [
        '@graphql-codegen/cli',
        '@graphql-codegen/typescript',
        '@graphql-codegen/typescript-operations',
        '@graphql-codegen/typed-document-node',
        '@graphql-typed-document-node/core',
        '@parcel/watcher',
      ]),
    }),
    codegen: createNodeTask((node) => {
      node.scripts.mergeObj(
        {
          generate: 'graphql-codegen',
          'watch:gql': 'graphql-codegen --watch',
        },
        'graphql-codegen',
      );
    }),
    reactTypescript: createProviderTask(
      reactTypescriptProvider,
      (reactTypescript) => {
        reactTypescript.addNodeTsFile('codegen.ts');
      },
    ),
    websocketPackages: enableSubscriptions
      ? createNodePackagesTask({
          prod: extractPackageVersions(REACT_PACKAGES, ['graphql-ws']),
        })
      : undefined,
    eslintConfig: createProviderTask(eslintConfigProvider, (eslintConfig) => {
      eslintConfig.eslintIgnore.push('src/generated/graphql.tsx');
    }),
    prettier: createProviderTask(prettierProvider, (prettier) => {
      prettier.addPrettierIgnore('src/generated/graphql.tsx');
    }),
    reactProxy: createProviderTask(reactProxyProvider, (reactProxy) => {
      if (enableSubscriptions) {
        reactProxy.enableWebSocket();
      }
    }),
    reactConfig: createProviderTask(reactConfigProvider, (reactConfig) => {
      reactConfig.configEntries.set('VITE_GRAPH_API_ENDPOINT', {
        comment: 'URL for the GraphQL API endpoint',
        validator: 'z.string().min(1)',
        devDefaultValue: devApiEndpoint,
      });

      if (enableSubscriptions) {
        reactConfig.configEntries.set('VITE_GRAPH_WS_API_ENDPOINT', {
          comment: 'URL for the GraphQL web socket API endpoint (optional)',
          validator: 'z.string()',
          devDefaultValue: '',
        });
      }
    }),
    reactAppConfig: createGeneratorTask({
      dependencies: {
        paths: APOLLO_REACT_APOLLO_GENERATED.paths.provider,
        reactAppConfig: reactAppConfigProvider,
      },
      run({ paths, reactAppConfig }) {
        reactAppConfig.renderWrappers.set('react-apollo', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports(
              tsImportBuilder(['AppApolloProvider']).from(
                paths.appApolloProvider,
              ),
            )`<AppApolloProvider>${contents}</AppApolloProvider>`,
          type: 'data',
        });
      },
    }),
    routerContext: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
      },
      run({ reactRouterConfig }) {
        reactRouterConfig.rootContextFields.add({
          name: 'apolloClient',
          type: tsTemplateWithImports([
            tsImportBuilder(['ApolloClient']).typeOnly().from('@apollo/client'),
          ])`ApolloClient`,
          optional: false,
          routerProviderInitializer: {
            code: tsTemplate`apolloClient`,
            dependencies: ['apolloClient'],
          },
        });

        reactRouterConfig.routerSetupFragments.set(
          'apollo-client',
          tsTemplateWithImports([
            tsImportBuilder(['useApolloClient']).from('@apollo/client/react'),
          ])`const apolloClient = useApolloClient();`,
        );
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        reactConfigImports: reactConfigImportsProvider,
        reactApolloConfigValues: reactApolloConfigValuesProvider,
        paths: APOLLO_REACT_APOLLO_GENERATED.paths.provider,
        renderers: APOLLO_REACT_APOLLO_GENERATED.renderers.provider,
      },
      exports: {
        reactApollo: reactApolloProvider.export(packageScope),
      },
      run({
        reactConfigImports,
        reactApolloConfigValues: {
          createApolloClientArguments,
          apolloLinks,
          websocketOptions,
        },
        paths,
        renderers,
      }) {
        return {
          providers: {
            reactApollo: {
              getGeneratedFilePath() {
                return paths.graphql;
              },
            },
          },
          build: async (builder) => {
            const findLink = (name: string): ApolloLink => {
              const link = apolloLinks.find((link) => link.name === name);
              if (!link) {
                throw new Error(`Link ${name} not found`);
              }
              return link;
            };
            const sortedLinks = toposortLocal(
              apolloLinks,
              apolloLinks.flatMap(
                (link) =>
                  link.dependencies?.map((dep): [ApolloLink, ApolloLink] => [
                    findLink(dep),
                    link,
                  ]) ?? [],
              ),
            ).toSorted(
              (a, b) =>
                APOLLO_LINK_PRIORITY[a.priority] -
                APOLLO_LINK_PRIORITY[b.priority],
            );

            sortedLinks.push({
              name: 'httpLink',
              transport: 'http',
              priority: 'network',
              bodyFragment: tsCodeFragment(
                `const httpLink = new HttpLink({
                  uri: config.VITE_GRAPH_API_ENDPOINT,
                });`,
                [
                  tsImportBuilder(['HttpLink']).from('@apollo/client'),
                  reactConfigImports.config.declaration(),
                ],
              ),
            });

            if (enableSubscriptions) {
              const websocketTemplate =
                await builder.readTemplate('websocket-links.ts');
              const getWsUrlTemplate = TsCodeUtils.extractTemplateSnippet(
                websocketTemplate,
                'GET_WS_URL',
              );
              const retryWaitTemplate = TsCodeUtils.extractTemplateSnippet(
                websocketTemplate,
                'RETRY_WAIT',
              ).replace(/;$/, '');

              // TODO: This should not live here but in auth service
              // TODO: This should live in the defaults not set afterwards to prevent them from being overridden
              websocketOptions.set(
                'connectionParams',
                tsCodeFragment(`async () => {
                  const accessToken = await getAccessToken();
                  if (!accessToken) {
                    return {};
                  }
                  return { authorization: \`Bearer \${accessToken}\` };
                }`),
              );

              websocketOptions.set(
                'url',
                tsCodeFragment(`getWsUrl()`, [], {
                  hoistedFragments: [
                    tsHoistedFragment('get-ws-url', getWsUrlTemplate),
                  ],
                }),
              );
              websocketOptions.set(
                'retryAttempts',
                "86_400 /* effectively retry forever (1 month of retries) - there's no way of disabling retry attempts */",
              );
              websocketOptions.set('retryWait', retryWaitTemplate);
              websocketOptions.set('shouldRetry', '() => true');

              const wsOptionsFragment =
                TsCodeUtils.mergeFragmentsAsObject(websocketOptions);

              sortedLinks.push({
                name: 'wsLink',
                transport: 'ws',
                priority: 'network',
                bodyFragment: TsCodeUtils.templateWithImports([
                  tsImportBuilder(['GraphQLWsLink']).from(
                    '@apollo/client/link/subscriptions',
                  ),
                  tsImportBuilder(['createClient']).from('graphql-ws'),
                ])`const wsLink = new GraphQLWsLink(createClient(${wsOptionsFragment}));`,
              });

              const wsLinks = sortedLinks.filter((l) => l.transport === 'ws');
              const httpLinks = sortedLinks.filter(
                (l) => l.transport === 'http',
              );

              const formatLinks = (
                linksToFormat: ApolloLink[],
              ): TsCodeFragment | string => {
                const linkNames = linksToFormat.map((link) => link.name);
                if (linkNames.length === 1) {
                  return linkNames[0];
                }
                return TsCodeUtils.templateWithImports([
                  tsImportBuilder(['ApolloLink']).from('@apollo/client'),
                ])`ApolloLink.from(${TsCodeUtils.mergeFragmentsPresorted(linkNames)})`;
              };

              sortedLinks.push({
                name: 'splitLink',
                priority: 'network',
                bodyFragment: TsCodeUtils.templateWithImports([
                  tsImportBuilder(['ApolloLink']).from('@apollo/client'),
                  tsImportBuilder(['getMainDefinition']).from(
                    '@apollo/client/utilities',
                  ),
                  tsImportBuilder(['Kind', 'OperationTypeNode']).from(
                    'graphql',
                  ),
                ])`
                const splitLink = ApolloLink.split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === Kind.OPERATION_DEFINITION &&
      definition.operation === OperationTypeNode.SUBSCRIPTION
    );
  },
  ${formatLinks(wsLinks)},
  ${formatLinks(httpLinks)},
);`,
              });
            }

            const createArgNames = createApolloClientArguments
              .map((arg) => arg.name)
              .join(', ');
            const apolloLinkFragments = sortedLinks
              .filter((apolloLink) => {
                if (enableSubscriptions) {
                  // subscriptions use the split link from above for transport-specific links
                  return (
                    !apolloLink.transport || apolloLink.transport === 'all'
                  );
                }
                return true;
              })
              .map((apolloLink) =>
                tsCodeFragment(apolloLink.name, apolloLink.nameImport),
              );

            // services/apollo/index.ts
            await builder.apply(
              renderers.service.render({
                variables: {
                  TPL_CREATE_ARGS:
                    createApolloClientArguments.length === 0
                      ? ''
                      : tsCodeFragment(
                          `{${createArgNames}}: CreateApolloClientOptions`,
                          undefined,
                          {
                            hoistedFragments: [
                              tsHoistedFragment(
                                'create-apollo-client-options',
                                tsTemplate`
                              interface CreateApolloClientOptions {
                                ${TsCodeUtils.mergeFragmentsAsInterfaceContent(
                                  Object.fromEntries(
                                    createApolloClientArguments.map((arg) => [
                                      arg.name,
                                      arg.type,
                                    ]),
                                  ),
                                )}
                              }
                              `,
                              ),
                            ],
                          },
                        ),
                  TPL_LINK_BODIES: TsCodeUtils.mergeFragmentsPresorted(
                    sortedLinks
                      .map((link) => link.bodyFragment)
                      .filter(notEmpty),
                    '\n\n',
                  ),
                  TPL_LINKS:
                    TsCodeUtils.mergeFragmentsAsArrayPresorted(
                      apolloLinkFragments,
                    ),
                },
              }),
            );

            // services/apollo/cache.ts
            await builder.apply(renderers.cache.render({}));

            // codegen.ts
            await builder.apply(
              renderers.codegenConfig.render({
                variables: {
                  TPL_BACKEND_SCHEMA: quot(schemaLocation),
                },
              }),
            );

            // app/AppApolloProvider.tsx
            await builder.apply(
              renderers.appApolloProvider.render({
                variables: {
                  TPL_RENDER_BODY: TsCodeUtils.mergeFragmentsPresorted(
                    createApolloClientArguments.map(
                      (arg) => arg.reactRenderBody,
                    ),
                    '\n\n',
                  ),
                  TPL_CREATE_ARGS:
                    createApolloClientArguments.length > 0
                      ? `{ ${createApolloClientArguments
                          .map((arg) => arg.name)
                          .join(', ')} }`
                      : '',
                  TPL_MEMO_DEPENDENCIES: createApolloClientArguments
                    .map((arg) => arg.name)
                    .join(', '),
                },
              }),
            );

            // write a pseudo-file so that the template extractor can infer metadata for the
            // generated graphql file

            // generated/graphql.tsx
            await builder.apply(renderers.graphql.render({}));

            builder.addPostWriteCommand('pnpm generate', {
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN,
              onlyIfChanged: ['codegen.ts', 'src/**/*.gql'],
            });
          },
        };
      },
    }),
    graphqlErrorContext: createGeneratorTask({
      dependencies: {
        reactErrorConfig: reactErrorConfigProvider,
      },
      run({ reactErrorConfig }) {
        const headerBlock = tsCodeFragment(
          `
          function annotateGraphQLError(
            error: GraphQLError | GraphQLFormattedError,
            context: Record<string, unknown>,
          ): void {
            context.reqId = error.extensions?.reqId;
            context.code = error.extensions?.code;
            context.statusCode = error.extensions?.statusCode;
            context.path = error.path?.join('.');
            // only visible in development
            const originalError = error.extensions?.originalError as {
              message?: string;
              stack?: string;
            } | null;
            if (typeof originalError === 'object' && originalError !== null) {
              context.originalError = originalError.message;
              const serverError = new Error(originalError.message);
              serverError.stack = \`[Original Error] \${originalError.stack}\`;
              logger.error(serverError);
            }
          }
  `,
          tsImportBuilder(['GraphQLError']).from('graphql'),
        );

        reactErrorConfig.contextActions.set(
          'apollo',
          tsCodeFragment(
            `
            if (error instanceof GraphQLError) {
              annotateGraphQLError(error, context);
            }

            if (CombinedGraphQLErrors.is(error)) {
              if (error.errors.length > 0) {
                annotateGraphQLError(error.errors[0], context);
              }
              // it's more useful to log the current stack trace than the one from
              // CombinedGraphQLErrors which is always the same
              const currentStack = new Error('stack').stack?.split('\\n');
              error.stack = [
                error.stack?.split('\\n')[0],
                currentStack
                  ?.slice(currentStack.findIndex((line) => line.includes('logError')) + 1)
                  .join('\\n'),
              ]
                .filter(Boolean)
                .join('\\n');
            }

            if (ServerError.is(error)) {
              context.networkErrorResponse = error.bodyText;
            }
          `,
            [
              tsImportBuilder(['GraphQLError']).from('graphql'),
              tsImportBuilder(['CombinedGraphQLErrors', 'ServerError']).from(
                '@apollo/client/errors',
              ),
              tsTypeImportBuilder(['GraphQLFormattedError']).from('graphql'),
            ],
            {
              hoistedFragments: [
                tsHoistedFragment('annotate-graphql-error', headerBlock),
              ],
            },
          ),
        );
        return {};
      },
    }),
  }),
});
