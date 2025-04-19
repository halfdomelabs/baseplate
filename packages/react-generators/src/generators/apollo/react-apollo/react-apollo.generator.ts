import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  createNodeTask,
  eslintProvider,
  extractPackageVersions,
  makeImportAndFilePath,
  prettierProvider,
  projectScope,
  TsCodeUtils,
  tsImportBuilder,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  POST_WRITE_COMMAND_PRIORITY,
  renderTextTemplateFileAction,
} from '@halfdomelabs/sync';
import { toposort } from '@halfdomelabs/utils';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { reactAppConfigProvider } from '@src/generators/core/react-app/react-app.generator.js';
import { reactConfigProvider } from '@src/generators/core/react-config/react-config.generator.js';
import { reactErrorProvider } from '@src/generators/core/react-error/react-error.generator.js';
import { reactProxyProvider } from '@src/generators/core/react-proxy/react-proxy.generator.js';

import { notEmpty } from '../../../utils/array.js';
import { APOLLO_REACT_APOLLO_TEXT_TEMPLATES } from './generated/text-templates.js';

const descriptorSchema = z.object({
  devApiEndpoint: z.string().min(1),
  schemaLocation: z.string().min(1),
  enableSubscriptions: z.boolean().optional(),
});

export interface ApolloCreateArg {
  name: string;
  type: TypescriptCodeExpression;
  creatorValue: TypescriptCodeExpression;
  createArgs?: string[];
  hookDependency?: string;
  renderBody?: TypescriptCodeBlock;
}

export interface ApolloLink {
  key?: string;
  name: string | TypescriptCodeExpression;
  bodyExpression?: TypescriptCodeBlock;
  dependencies?: [string, string][];
  httpOnly?: boolean;
  wsOnly?: boolean;
}

export interface ReactApolloSetupProvider extends ImportMapper {
  addCreateArg(arg: ApolloCreateArg): void;
  addLink(link: ApolloLink): void;
  addWebsocketOption(name: string, expression: TypescriptCodeExpression): void;
  getApiEndpointExpression(): TypescriptCodeExpression;
  registerGqlFile(filePath: string): void;
}

export const reactApolloSetupProvider =
  createProviderType<ReactApolloSetupProvider>('react-apollo-setup');

export interface ReactApolloProvider extends ImportMapper {
  registerGqlFile(filePath: string): void;
  getGeneratedFilePath(): string;
}

export const reactApolloProvider =
  createProviderType<ReactApolloProvider>('react-apollo');

export const reactApolloGenerator = createGenerator({
  name: 'apollo/react-apollo',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: ({ devApiEndpoint, schemaLocation, enableSubscriptions }) => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, [
        '@apollo/client',
        'graphql',
      ]),
      dev: extractPackageVersions(REACT_PACKAGES, [
        '@graphql-codegen/cli',
        '@graphql-codegen/typescript',
        '@graphql-codegen/typescript-operations',
        '@graphql-codegen/typescript-react-apollo',
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
    websocketPackages: enableSubscriptions
      ? createNodePackagesTask({
          prod: extractPackageVersions(REACT_PACKAGES, ['graphql-ws']),
        })
      : undefined,
    main: createGeneratorTask({
      dependencies: {
        reactConfig: reactConfigProvider,
        typescript: typescriptProvider,
        reactAppConfig: reactAppConfigProvider,
        eslint: eslintProvider,
        prettier: prettierProvider,
        reactProxy: reactProxyProvider,
      },
      exports: {
        reactApolloSetup: reactApolloSetupProvider.export(projectScope),
        reactApollo: reactApolloProvider.export(projectScope),
      },
      run({
        reactConfig,
        typescript,
        reactAppConfig,
        eslint,
        prettier,
        reactProxy,
      }) {
        const apolloCreateArgs: ApolloCreateArg[] = [];
        const links: ApolloLink[] = [];
        const gqlFiles: string[] = [];

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

        const cacheFile = typescript.createTemplate({});
        const cachePath = 'src/services/apollo/cache.ts';

        const [clientImport, clientPath] = makeImportAndFilePath(
          'src/services/apollo/index.ts',
        );

        const [providerImport, providerPath] = makeImportAndFilePath(
          'src/app/AppApolloProvider.tsx',
        );

        reactAppConfig.renderWrappers.set('react-apollo', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports(
              tsImportBuilder()
                .default('AppApolloProvider')
                .from(providerImport),
            )`<AppApolloProvider>${contents}</AppApolloProvider>`,
          type: 'data',
        });

        const importMap = {
          '%react-apollo/client': {
            path: clientImport,
            allowedImports: ['createApolloClient'],
          },
          '%react-apollo/generated': {
            path: '@/src/generated/graphql',
            allowedImports: ['*'],
          },
        };

        eslint
          .getConfig()
          .appendUnique('eslintIgnore', ['src/generated/graphql.tsx']);

        prettier.addPrettierIgnore('src/generated/graphql.tsx');

        const websocketOptions = createNonOverwriteableMap<
          Record<string, TypescriptCodeExpression | string>
        >({});

        if (enableSubscriptions) {
          reactProxy.enableWebSocket();
        }

        return {
          providers: {
            reactApolloSetup: {
              addCreateArg(arg) {
                apolloCreateArgs.push(arg);
              },
              addLink(link) {
                links.push(link);
              },
              getApiEndpointExpression() {
                return new TypescriptCodeExpression(
                  'config.VITE_GRAPH_API_ENDPOINT',
                  'import { config } from "%react-config";',
                  { importMappers: [reactConfig] },
                );
              },
              registerGqlFile(filePath) {
                gqlFiles.push(filePath);
              },
              getImportMap() {
                return importMap;
              },
              addWebsocketOption(name, expression) {
                websocketOptions.set(name, expression);
              },
            },
            reactApollo: {
              registerGqlFile(filePath) {
                gqlFiles.push(filePath);
              },
              getImportMap() {
                return importMap;
              },
              getGeneratedFilePath() {
                return '@/src/generated/graphql';
              },
            },
          },
          build: async (builder) => {
            const sortedLinks = toposort(
              links.map((link) => link.key ?? link.name),
              links.flatMap((link) => link.dependencies ?? []),
            )
              .map((name) => links.find((link) => link.name === name))
              .filter(notEmpty);
            // always push http link at the last one
            sortedLinks.push({
              name: 'httpLink',
              httpOnly: true,
              bodyExpression: new TypescriptCodeBlock(
                `const httpLink = new HttpLink({
                  uri: config.VITE_GRAPH_API_ENDPOINT,
                });`,
                [
                  `import { HttpLink } from '@apollo/client';`,
                  `import { config } from '%react-config';`,
                ],
                { importMappers: [reactConfig] },
              ),
            });

            if (enableSubscriptions) {
              const websocketTemplate =
                await builder.readTemplate('websocket-links.ts');
              const getWsUrlTemplate =
                TypescriptCodeUtils.extractTemplateSnippet(
                  websocketTemplate,
                  'GET_WS_URL',
                );
              const retryWaitTemplate =
                TypescriptCodeUtils.extractTemplateSnippet(
                  websocketTemplate,
                  'RETRY_WAIT',
                ).replace(/;$/, '');

              websocketOptions.merge({
                connectionParams:
                  TypescriptCodeUtils.createExpression(`async () => {
                  const accessToken = await getAccessToken();
                  if (!accessToken) {
                    return {};
                  }
                  return { authorization: \`Bearer \${accessToken}\` };
                }`),
                url: TypescriptCodeUtils.createExpression(
                  `getWsUrl()`,
                  undefined,
                  {
                    headerBlocks: [
                      TypescriptCodeUtils.createBlock(getWsUrlTemplate),
                    ],
                  },
                ),
                retryAttempts:
                  "86400 /* effectively retry forever (1 month of retries) - there's no way of disabling retry attempts */",
                retryWait: retryWaitTemplate,
                shouldRetry: '() => true',
              });

              const wsOptions = TypescriptCodeUtils.mergeExpressionsAsObject(
                websocketOptions.value(),
              );

              sortedLinks.push({
                name: 'wsLink',
                wsOnly: true,
                bodyExpression: TypescriptCodeUtils.formatBlock(
                  `const wsLink = new GraphQLWsLink(createClient(WS_OPTIONS));`,
                  { WS_OPTIONS: wsOptions },
                  {
                    importText: [
                      `import { GraphQLWsLink } from '@apollo/client/link/subscriptions';`,
                      `import { createClient } from 'graphql-ws';`,
                    ],
                  },
                ),
              });

              const splitLinkTemplate =
                TypescriptCodeUtils.extractTemplateSnippet(
                  websocketTemplate,
                  'SPLIT_LINK',
                );

              const wsLinks = sortedLinks.filter((l) => l.wsOnly);
              const httpLinks = sortedLinks.filter((l) => l.httpOnly);

              const formatLinks = (
                linksToFormat: ApolloLink[],
              ): TypescriptCodeExpression => {
                const linkNames = linksToFormat.map((link) =>
                  typeof link.name === 'string'
                    ? new TypescriptCodeExpression(link.name)
                    : link.name,
                );
                if (linkNames.length === 1) {
                  return linkNames[0];
                }
                return TypescriptCodeUtils.mergeExpressionsAsArray(
                  linkNames,
                ).wrap(
                  (contents) => `from(${contents})`,
                  'import { from } from "@apollo/client";',
                );
              };

              sortedLinks.push({
                name: 'splitLink',
                bodyExpression: TypescriptCodeUtils.formatBlock(
                  splitLinkTemplate,
                  {
                    WS_LINK: formatLinks(wsLinks),
                    HTTP_LINK: formatLinks(httpLinks),
                  },
                  {
                    importText: [
                      `import { split } from '@apollo/client';`,
                      `import { getMainDefinition } from '@apollo/client/utilities';`,
                      `import { Kind, OperationTypeNode } from 'graphql';`,
                    ],
                  },
                ),
              });
            }

            await builder.apply(
              cacheFile.renderToAction('services/apollo/cache.ts', cachePath),
            );

            const createArgNames = apolloCreateArgs
              .map((arg) => arg.name)
              .join(', ');

            const clientFile = typescript.createTemplate({
              CREATE_ARGS:
                apolloCreateArgs.length === 0
                  ? new TypescriptCodeExpression('')
                  : TypescriptCodeUtils.createExpression(
                      `{${createArgNames}}: CreateApolloClientOptions`,
                      undefined,
                      {
                        headerBlocks: [
                          TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                            Object.fromEntries(
                              apolloCreateArgs.map((arg) => [
                                arg.name,
                                arg.type,
                              ]),
                            ),
                          ).wrap(
                            (contents) =>
                              `interface CreateApolloClientOptions {\n${contents}\n}`,
                          ),
                        ],
                      },
                    ),
              LINK_BODIES: TypescriptCodeUtils.mergeBlocks(
                sortedLinks.map((link) => link.bodyExpression).filter(notEmpty),
                '\n\n',
              ),
              LINKS: TypescriptCodeUtils.mergeExpressionsAsArray(
                sortedLinks
                  .filter((l) =>
                    enableSubscriptions ? !l.httpOnly && !l.wsOnly : true,
                  )
                  .map((link) =>
                    typeof link.name === 'string'
                      ? new TypescriptCodeExpression(link.name)
                      : link.name,
                  ),
              ),
            });

            await builder.apply(
              clientFile.renderToAction('services/apollo/index.ts', clientPath),
            );

            await builder.apply(
              renderTextTemplateFileAction({
                template: APOLLO_REACT_APOLLO_TEXT_TEMPLATES.codegenYml,
                destination: 'codegen.yml',
                variables: {
                  TPL_SCHEMA_LOCATION: schemaLocation,
                },
              }),
            );

            const apolloProviderFile = typescript.createTemplate(
              {
                RENDER_BODY: TypescriptCodeUtils.mergeBlocks(
                  apolloCreateArgs
                    .map((arg) => arg.renderBody)
                    .filter(notEmpty),
                ),
                CREATE_ARG_VALUE:
                  apolloCreateArgs.length === 0
                    ? TypescriptCodeUtils.createExpression('')
                    : TypescriptCodeUtils.mergeExpressionsAsObject(
                        Object.fromEntries(
                          apolloCreateArgs.map((arg) => [
                            arg.name,
                            arg.creatorValue,
                          ]),
                        ),
                      ),
                CREATE_ARGS: TypescriptCodeUtils.createExpression(
                  apolloCreateArgs
                    .map((arg) => arg.hookDependency)
                    .filter(notEmpty)
                    .join(', '),
                ),
              },
              {
                importMappers: [{ getImportMap: () => importMap }],
              },
            );

            await builder.apply(
              apolloProviderFile.renderToAction(
                'app/AppApolloProvider.tsx',
                providerPath,
              ),
            );

            builder.addPostWriteCommand('pnpm generate', {
              // run after prisma generate
              priority: POST_WRITE_COMMAND_PRIORITY.CODEGEN + 1,
              onlyIfChanged: [...gqlFiles, 'codegen.yml'],
            });
          },
        };
      },
    }),
    graphqlErrorContext: createGeneratorTask({
      dependencies: {
        reactErrorProvider,
      },
      run({ reactErrorProvider }) {
        const headerBlock = TypescriptCodeUtils.createBlock(
          `
          function annotateGraphQLError(
            error: GraphQLError,
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
            };
            if (typeof originalError === 'object' && originalError !== null) {
              context.originalError = originalError.message;
              const serverError = new Error(originalError.message);
              serverError.stack = \`[Original Error] \${originalError.stack}\`;
              logger.error(serverError);
            }
          }
  `,
          `import { GraphQLError } from 'graphql'`,
        );

        reactErrorProvider.addContextAction(
          TypescriptCodeUtils.createBlock(
            `
            if (error instanceof GraphQLError) {
              annotateGraphQLError(error, context);
            }
          
            if (error instanceof ApolloError) {
              if (error.graphQLErrors.length >= 1) {
                annotateGraphQLError(error.graphQLErrors[0], context);
              }
              if (error.networkError && 'result' in error.networkError) {
                const result = error.networkError.result;
                const message =
                  typeof result === 'string'
                    ? result
                    : (
                        result.errors as {
                          message?: string;
                        }[]
                      )?.[0]?.message ?? JSON.stringify(result);
          
                context.networkErrorResponse = message;
              }
              // it's more useful to log the current stack trace than the one from
              // ApolloError which is always the same
              const currentStack = new Error().stack?.split('\\n');
              error.stack = [
                error.stack?.split('\\n')[0],
                currentStack
                  ?.slice(currentStack.findIndex((line) => line.includes('logError')) + 1)
                  .join('\\n'),
              ]
                .filter(Boolean)
                .join('\\n');
            }
          `,
            [
              `import { GraphQLError } from 'graphql'`,
              `import { ApolloError } from '@apollo/client'`,
            ],
            {
              headerBlocks: [headerBlock],
            },
          ),
        );
        return {};
      },
    }),
  }),
});
