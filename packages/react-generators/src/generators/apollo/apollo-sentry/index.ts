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
    return {
      build: () => {
        reactSentry.addSentryScopeAction(
          new TypescriptCodeBlock(
            `
        if (error instanceof GraphQLError) {
          scope.setFingerprint(
            [
              '{{ default }}',
              error.extensions?.code as string,
              error.path?.join('.'),
            ].filter(
              (value): value is string => typeof value === 'string' && !!value,
            ),
          );
          if (error.path?.[0]) {
            scope.setTransactionName(String(error.path[0]));
            scope.setTag('path', String(error.path?.join('.')));
          }
        }
        `,
            "import { GraphQLError } from 'graphql'",
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
