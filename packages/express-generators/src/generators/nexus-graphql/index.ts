import {
  createTypescriptTemplateConfig,
  nodeProvider,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  copyDirectoryAction,
  readTemplate,
} from '@baseplate/sync';
import * as yup from 'yup';
import { expressProvider } from '../express';

interface NexusGraphQLDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

const CONTEXT_FILE_CONFIG = createTypescriptTemplateConfig({
  CONTEXT_INTERFACE: { type: 'code-block' },
  CONTEXT_SETUP: { type: 'code-block' },
  CONTEXT_OBJECT: { type: 'code-expression' },
});

export type NexusGraphQLProvider = {
  getContextFile(): TypescriptSourceFile<typeof CONTEXT_FILE_CONFIG>;
};

export const nexusGraphQLProvider = createProviderType<NexusGraphQLProvider>(
  'nexus-graphql'
);

const NexusGraphQLGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusGraphQLDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    express: expressProvider,
    node: nodeProvider,
  },
  exports: {
    nexusGraphQL: nexusGraphQLProvider,
  },
  createGenerator(descriptor, { node, express }) {
    const contextFile = new TypescriptSourceFile(CONTEXT_FILE_CONFIG);

    node.addPackages({
      'apollo-server-express': '^2.19.1',
      graphql: '^15.4.0',
      nexus: '^1.0.0',
    });

    express.getServerFile().addCodeBlock('SERVER_MIDDLEWARE', {
      code: `
        const graphQLServer = createApolloServer();
        graphQLServer.applyMiddleware({ app });
      `,
      importText: ["import {createApolloServer} from '@/src/graphql/server'"],
    });
    express.getServerFile().addCodeBlock('POST_START', {
      code:
        'console.log(`GraphQL endpoint: http://localhost:${port}${graphQLServer.graphqlPath}`);',
    });
    express.getTypesFile().addCodeBlock('APP_FEATURE_TYPE', {
      code:
        '// eslint-disable-next-line @typescript-eslint/no-explicit-any\nschema: any[];',
    });
    return {
      getProviders: () => ({
        nexusGraphQL: {
          getContextFile: () => contextFile,
        },
      }),
      build: async (context) => {
        context.addAction(
          copyDirectoryAction({
            source: 'graphql',
            destination: 'src/graphql',
          })
        );

        const contextFileTemplate = await readTemplate(
          __dirname,
          'graphql/context.ts'
        );
        context.addAction(
          contextFile.renderToAction(
            contextFileTemplate,
            'src/graphql/context.ts'
          )
        );
      },
    };
  },
});

export default NexusGraphQLGenerator;
