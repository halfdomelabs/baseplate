import {
  eslintProvider,
  ImportMapper,
  makeImportAndFilePath,
  nodeProvider,
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
import toposort from 'toposort';
import { z } from 'zod';
import { notEmpty } from '../../../utils/array';
import { reactAppProvider } from '../../core/react-app';
import { reactConfigProvider } from '../../core/react-config';

const descriptorSchema = z.object({
  devApiEndpoint: z.string().min(1),
  schemaLocation: z.string().min(1),
});

export interface ApolloLink {
  name: string;
  bodyExpression: TypescriptCodeBlock;
  dependencies?: [string, string][];
}

export interface ReactApolloSetupProvider extends ImportMapper {
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
  },
  exports: {
    reactApolloSetup: reactApolloSetupProvider,
    reactApollo: reactApolloProvider,
  },
  createGenerator(
    { devApiEndpoint, schemaLocation },
    { node, reactConfig, typescript, reactApp, eslint }
  ) {
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

    const clientFile = typescript.createTemplate({
      LINK_BODIES: { type: 'code-block' },
      LINKS: { type: 'code-expression' },
    });
    const [clientImport, clientPath] = makeImportAndFilePath(
      'src/services/apollo/index.ts'
    );

    reactApp.getAppFile().addCodeEntries({
      RENDER_WRAPPERS: TypescriptCodeUtils.createWrapper(
        (contents) =>
          `<ApolloProvider client={apolloClient}>${contents}</ApolloProvider>`,
        [
          `import { ApolloProvider } from '@apollo/client';`,
          `import { apolloClient } from '${clientImport}';`,
        ]
      ),
    });

    const importMap = {
      '%react-apollo/client': {
        path: clientImport,
        allowedImports: ['apolloClient'],
      },
      '%react-apollo/generated': {
        path: '@/src/generated/graphql',
        allowedImports: ['*'],
      },
    };

    eslint
      .getConfig()
      .appendUnique('eslintIgnore', ['src/generated/graphql.tsx']);

    return {
      getProviders: () => ({
        reactApolloSetup: {
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

        clientFile.addCodeEntries({
          LINK_BODIES: sortedLinks.map((link) => link.bodyExpression),
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

        builder.addPostWriteCommand('yarn generate', {
          onlyIfChanged: gqlFiles,
        });
      },
    };
  },
});

export default ReactApolloGenerator;
