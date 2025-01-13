import type { ImportMapper } from '@halfdomelabs/core-generators';

import {
  makeImportAndFilePath,
  projectScope,
  tsUtilsProvider,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  copyFileAction,
  createGeneratorWithTasks,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactUtilsProvider } from '@src/generators/core/react-utils/index.js';

import { reactApolloSetupProvider } from '../../apollo/react-apollo/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

export type AuthServiceProvider = ImportMapper;

export const authServiceProvider =
  createProviderType<AuthServiceProvider>('auth-service');

const AuthServiceGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        tsUtils: tsUtilsProvider,
        reactApolloSetup: reactApolloSetupProvider,
        typescript: typescriptProvider,
        reactUtils: reactUtilsProvider,
      },
      exports: {
        authService: authServiceProvider.export(projectScope),
      },
      run({ tsUtils, reactApolloSetup, typescript, reactUtils }) {
        const authFolder = 'src/services/auth';
        const [serviceImport, servicePath] = makeImportAndFilePath(
          `${authFolder}/index.ts`,
        );

        const tokensFile = typescript.createTemplate(
          {
            API_ENDPOINT_URI: { type: 'code-expression' },
          },
          {
            importMappers: [reactApolloSetup],
          },
        );
        tokensFile.addCodeEntries({
          API_ENDPOINT_URI: reactApolloSetup.getApiEndpointExpression(),
        });
        reactApolloSetup.registerGqlFile(`${authFolder}/tokens.gql`);

        const [, tokensPath] = makeImportAndFilePath(`${authFolder}/tokens.ts`);
        const [, typesPath] = makeImportAndFilePath(`${authFolder}/types.ts`);

        return {
          getProviders: () => ({
            authService: {
              getImportMap: () => ({
                '%auth-service': {
                  path: serviceImport,
                  allowedImports: ['authService'],
                },
              }),
            },
          }),
          build: async (builder) => {
            await builder.apply(
              typescript.createCopyAction({
                source: 'index.ts',
                destination: servicePath,
                importMappers: [tsUtils, reactUtils],
              }),
            );

            await builder.apply(
              tokensFile.renderToAction('tokens.ts', tokensPath),
            );

            await builder.apply(
              typescript.createCopyAction({
                source: 'types.ts',
                destination: typesPath,
              }),
            );

            await builder.apply(
              copyFileAction({
                source: 'tokens.gql',
                destination: `${authFolder}/tokens.gql`,
                shouldFormat: true,
              }),
            );
          },
        };
      },
    });
  },
});

export default AuthServiceGenerator;
