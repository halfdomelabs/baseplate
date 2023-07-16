import {
  eslintProvider,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
  prettierProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeTemplateAction,
  createNonOverwriteableMap,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import toposort from 'toposort';
import { z } from 'zod';
import { reactProxyProvider } from '@src/generators/core/react-proxy/index.js';
import { notEmpty } from '../../../utils/array.js';
import { reactAppProvider } from '../../core/react-app/index.js';
import { reactConfigProvider } from '../../core/react-config/index.js';

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
  name: string;
  bodyExpression: TypescriptCodeBlock;
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

const ReactApolloGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({
    errorLink: {
      defaultDescriptor: {
        generator: '@halfdomelabs/react/apollo/apollo-error-link',
      },
    },
  }),
  dependencies: {
    node: nodeProvider,
    reactConfig: reactConfigProvider,
    typescript: typescriptProvider,
    reactApp: reactAppProvider,
    eslint: eslintProvider,
    prettier: prettierProvider,
    reactProxy: reactProxyProvider,
  },
  exports: {
    reactApolloSetup: reactApolloSetupProvider,
    reactApollo: reactApolloProvider,
  },
  createGenerator(
    { devApiEndpoint, schemaLocation, enableSubscriptions },
    { node, reactConfig, typescript, reactApp, eslint, prettier, reactProxy }
  ) {
    const apolloCreateArgs: ApolloCreateArg[] = [];
    const links: ApolloLink[] = [];
    const gqlFiles: string[] = [];

    node.addPackages({
      '@apollo/client': '3.7.17',
      graphql: '16.7.1',
    });

    if (enableSubscriptions) {
      node.addPackages({
        'graphql-ws': '5.14.0',
      });
    }

    node.addDevPackages({
      '@graphql-codegen/cli': '4.0.1',
      '@graphql-codegen/typescript': '4.0.1',
      '@graphql-codegen/typescript-operations': '4.0.1',
      '@graphql-codegen/typescript-react-apollo': '3.3.7',
    });

    node.addScripts({
      generate: 'graphql-codegen',
    });

    reactConfig.getConfigMap().set('VITE_GRAPH_API_ENDPOINT', {
      comment: 'URL for the GraphQL API endpoint',
      validator: TypescriptCodeUtils.createExpression('z.string().min(1)'),
      devValue: devApiEndpoint,
    });

    if (enableSubscriptions) {
      reactConfig.getConfigMap().set('VITE_GRAPH_WS_API_ENDPOINT', {
        comment: 'URL for the GraphQL web socket API endpoint (optional)',
        validator: TypescriptCodeUtils.createExpression('z.string()'),
        devValue: '',
      });
    }

    const cacheFile = typescript.createTemplate({});
    const cachePath = 'src/services/apollo/cache.ts';

    const [clientImport, clientPath] = makeImportAndFilePath(
      'src/services/apollo/index.ts'
    );

    const [providerImport, providerPath] = makeImportAndFilePath(
      'src/app/AppApolloProvider.tsx'
    );

    reactApp.getRenderWrappers().addItem(
      'react-apollo',
      TypescriptCodeUtils.createWrapper(
        (contents) => `<AppApolloProvider>${contents}</AppApolloProvider>`,
        [`import AppApolloProvider from '${providerImport}';`]
      )
    );

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
      getProviders: () => ({
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
              { importMappers: [reactConfig] }
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
      }),
      build: async (builder) => {
        const sortedLinks = toposort
          .array(
            links.map((link) => link.name),
            links.flatMap((link) => link.dependencies || [])
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
            { importMappers: [reactConfig] }
          ),
        });

        if (enableSubscriptions) {
          const websocketTemplate = await builder.readTemplate(
            'websocket-links.ts'
          );
          const getWsUrlTemplate = TypescriptCodeUtils.extractTemplateSnippet(
            websocketTemplate,
            'GET_WS_URL'
          );
          const retryWaitTemplate = TypescriptCodeUtils.extractTemplateSnippet(
            websocketTemplate,
            'RETRY_WAIT'
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
            url: TypescriptCodeUtils.createExpression(`getWsUrl()`, undefined, {
              headerBlocks: [TypescriptCodeUtils.createBlock(getWsUrlTemplate)],
            }),
            retryAttempts:
              "86400 /* effectively retry forever (1 month of retries) - there's no way of disabling retry attempts */",
            retryWait: retryWaitTemplate,
            shouldRetry: '() => true',
          });

          const wsOptions = TypescriptCodeUtils.mergeExpressionsAsObject(
            websocketOptions.value()
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
              }
            ),
          });

          const splitLinkTemplate = TypescriptCodeUtils.extractTemplateSnippet(
            websocketTemplate,
            'SPLIT_LINK'
          );

          const wsLinks = sortedLinks.filter((l) => l.wsOnly);
          const httpLinks = sortedLinks.filter((l) => l.httpOnly);

          const formatLinks = (
            linksToFormat: ApolloLink[]
          ): TypescriptCodeExpression => {
            const linkNames = linksToFormat.map(
              (link) => new TypescriptCodeExpression(link.name)
            );
            if (linkNames.length === 1) {
              return linkNames[0];
            }
            return TypescriptCodeUtils.mergeExpressionsAsArray(linkNames).wrap(
              (contents) => `from(${contents})`,
              'import { from } from "@apollo/client";'
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
                ],
              }
            ),
          });
        }

        await builder.apply(
          cacheFile.renderToAction('services/apollo/cache.ts', cachePath)
        );

        const createArgNames = apolloCreateArgs
          .map((arg) => arg.name)
          .join(', ');

        const clientFile = typescript.createTemplate({
          CREATE_ARGS: !apolloCreateArgs.length
            ? new TypescriptCodeExpression('')
            : TypescriptCodeUtils.createExpression(
                `{${createArgNames}}: CreateApolloClientOptions`,
                undefined,
                {
                  headerBlocks: [
                    TypescriptCodeUtils.mergeBlocksAsInterfaceContent(
                      R.fromPairs(
                        apolloCreateArgs.map((arg) => [arg.name, arg.type])
                      )
                    ).wrap(
                      (contents) =>
                        `interface CreateApolloClientOptions {\n${contents}\n}`
                    ),
                  ],
                }
              ),
          LINK_BODIES: TypescriptCodeUtils.mergeBlocks(
            sortedLinks.map((link) => link.bodyExpression),
            '\n\n'
          ),
          LINKS: TypescriptCodeUtils.mergeExpressionsAsArray(
            sortedLinks
              .filter((l) =>
                enableSubscriptions ? !l.httpOnly && !l.wsOnly : true
              )
              .map((link) => new TypescriptCodeExpression(link.name))
          ),
        });

        await builder.apply(
          clientFile.renderToAction('services/apollo/index.ts', clientPath)
        );

        await builder.apply(
          writeTemplateAction({
            template: 'codegen.yml',
            destination: 'codegen.yml',
            data: {
              SCHEMA_LOCATION: schemaLocation,
            },
          })
        );

        const apolloProviderFile = typescript.createTemplate(
          {
            RENDER_BODY: TypescriptCodeUtils.mergeBlocks(
              apolloCreateArgs.map((arg) => arg.renderBody).filter(notEmpty)
            ),
            CREATE_ARG_VALUE: !apolloCreateArgs.length
              ? TypescriptCodeUtils.createExpression('')
              : TypescriptCodeUtils.mergeExpressionsAsObject(
                  R.fromPairs(
                    apolloCreateArgs.map((arg) => [arg.name, arg.creatorValue])
                  )
                ),
            CREATE_ARGS: TypescriptCodeUtils.createExpression(
              apolloCreateArgs
                .map((arg) => arg.hookDependency)
                .filter(notEmpty)
                .join(', ')
            ),
          },
          {
            importMappers: [{ getImportMap: () => importMap }],
          }
        );

        await builder.apply(
          apolloProviderFile.renderToAction(
            'app/AppApolloProvider.tsx',
            providerPath
          )
        );

        builder.addPostWriteCommand('yarn generate', 'generation', {
          onlyIfChanged: [...gqlFiles, 'codegen.yml'],
        });
      },
    };
  },
});

export default ReactApolloGenerator;
