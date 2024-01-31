import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  makeImportAndFilePath,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactApolloSetupProvider } from '../react-apollo/index.js';
import { reactSentryProvider } from '@src/generators/core/react-sentry/index.js';

const descriptorSchema = z.object({});

const apolloSentryLinkTask = createTaskConfigBuilder(() => ({
  name: 'apolloSentryLink',
  dependencies: {
    reactApolloSetup: reactApolloSetupProvider,
    typescript: typescriptProvider,
  },
  run({ reactApolloSetup, typescript }) {
    const [linkImport, linkPath] = makeImportAndFilePath(
      'src/services/apollo/apollo-sentry-link.ts',
    );
    return {
      async build(builder) {
        await builder.apply(
          typescript.createCopyAction({
            source: 'apollo-sentry-link.ts',
            destination: linkPath,
          }),
        );

        reactApolloSetup.addLink({
          key: 'apolloSentryLink',
          name: TypescriptCodeUtils.createExpression(`apolloSentryLink`, [
            `import { apolloSentryLink } from '${linkImport}'`,
          ]),
          dependencies: [['errorLink', 'apolloSentryLink']],
        });
      },
    };
  },
}));

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    reactSentry: reactSentryProvider,
  },
  run({ reactSentry }) {
    const headerBlock = TypescriptCodeUtils.createBlock(
      `
      function configureSentryScopeForGraphqlError(
        scope: Sentry.Scope,
        error: GraphQLError,
      ): void {
        scope.setFingerprint(
          [
            '{{ default }}',
            error.extensions?.code as string,
            error.path?.join('.'),
          ].filter((value): value is string => typeof value === 'string' && !!value),
        );
        if (error.path?.[0]) {
          scope.setTransactionName(String(error.path[0]));
          scope.setTag('path', String(error.path?.join('.')));
        }
      }
      `,
      "import { GraphQLError } from 'graphql'",
    );
    return {
      build: () => {
        reactSentry.addSentryScopeAction(
          new TypescriptCodeBlock(
            `
            if (error instanceof ApolloError && error.graphQLErrors.length === 1) {
              const graphqlError = error.graphQLErrors[0];
              configureSentryScopeForGraphqlError(scope, graphqlError);
            }
        
            if (error instanceof GraphQLError) {
              configureSentryScopeForGraphqlError(scope, error);
            }
        `,
            [
              "import { GraphQLError } from 'graphql'",
              "import { ApolloError } from '@apollo/client';",
            ],
            { headerBlocks: [headerBlock] },
          ),
        );
      },
    };
  },
}));

const ApolloSentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder) {
    taskBuilder.addTask(createMainTask);
    taskBuilder.addTask(apolloSentryLinkTask);
  },
});

export default ApolloSentryGenerator;
