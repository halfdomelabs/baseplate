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
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  writeTemplateAction,
} from '@baseplate/sync';
import R from 'ramda';
import toposort from 'toposort';
import { z } from 'zod';
import { notEmpty } from '../../../utils/array';
import { reactAppProvider } from '../../core/react-app';
import { reactConfigProvider } from '../../core/react-config';

const descriptorSchema = z.object({
  devApiEndpoint: z.string().min(1),
  schemaLocation: z.string().min(1),
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
}

export interface ReactApolloSetupProvider extends ImportMapper {
  addCreateArg(arg: ApolloCreateArg): void;
  addLink(link: ApolloLink): void;
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
        generator: '@baseplate/react/apollo/apollo-error-link',
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
  },
  exports: {
    reactApolloSetup: reactApolloSetupProvider,
    reactApollo: reactApolloProvider,
  },
  createGenerator(
    { devApiEndpoint, schemaLocation },
    { node, reactConfig, typescript, reactApp, eslint, prettier }
  ) {
    const apolloCreateArgs: ApolloCreateArg[] = [];
    const links: ApolloLink[] = [];
    const gqlFiles: string[] = [];

    node.addPackages({
      '@apollo/client': '^3.5.10',
      graphql: '^16.3.0',
    });

    node.addDevPackages({
      '@graphql-codegen/cli': '2.6.2',
      '@graphql-codegen/typescript': '2.4.8',
      '@graphql-codegen/typescript-operations': '2.3.5',
      '@graphql-codegen/typescript-react-apollo': '3.2.11',
    });

    node.addScripts({
      generate: 'graphql-codegen --config codegen.yml',
    });

    reactConfig.getConfigMap().set('REACT_APP_GRAPH_API_ENDPOINT', {
      comment: 'URL for the GraphQL API endpoint',
      validator: TypescriptCodeUtils.createExpression('z.string().min(1)'),
      devValue: devApiEndpoint,
    });

    const cacheFile = typescript.createTemplate({});
    const cachePath = 'src/services/apollo/cache.ts';

    const [clientImport, clientPath] = makeImportAndFilePath(
      'src/services/apollo/index.ts'
    );

    const [providerImport, providerPath] = makeImportAndFilePath(
      'src/app/AppApolloProvider.tsx'
    );

    reactApp.getAppFile().addCodeEntries({
      RENDER_WRAPPERS: TypescriptCodeUtils.createWrapper(
        (contents) => `<AppApolloProvider>${contents}</AppApolloProvider>`,
        [`import AppApolloProvider from '${providerImport}';`]
      ),
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
              'config.REACT_APP_GRAPH_API_ENDPOINT',
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
          bodyExpression: new TypescriptCodeBlock(
            `const httpLink = new HttpLink({
              uri: config.REACT_APP_GRAPH_API_ENDPOINT,
            });`,
            [
              `import { HttpLink } from '@apollo/client';`,
              `import { config } from '%react-config';`,
            ],
            { importMappers: [reactConfig] }
          ),
        });

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
            sortedLinks.map((link) => new TypescriptCodeExpression(link.name))
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

        builder.addPostWriteCommand('yarn generate', {
          onlyIfChanged: [...gqlFiles, 'codegen.yml'],
        });
      },
    };
  },
});

export default ReactApolloGenerator;
