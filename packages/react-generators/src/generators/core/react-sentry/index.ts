import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGeneratorWithTasks,
  createProviderType,
  createTaskConfigBuilder,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactConfigProvider } from '../react-config/index.js';
import { reactErrorProvider } from '../react-error/index.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/index.js';

const descriptorSchema = z.object({});

export interface ReactSentryProvider {
  addSentryScopeAction(block: TypescriptCodeBlock): void;
}

export const reactSentryProvider =
  createProviderType<ReactSentryProvider>('react-sentry');

const createMainTask = createTaskConfigBuilder(() => ({
  name: 'main',
  dependencies: {
    typescript: typescriptProvider,
    reactError: reactErrorProvider,
    reactConfig: reactConfigProvider,
    node: nodeProvider,
    authIdentify: authIdentifyProvider,
  },
  exports: {
    reactSentryProvider,
  },
  run({ typescript, reactError, reactConfig, node, authIdentify }) {
    const sentryFile = typescript.createTemplate(
      {
        SENTRY_SCOPE_ACTIONS: {
          type: 'code-block',
        },
      },
      { importMappers: [reactConfig] },
    );
    const [sentryImport, sentryPath] = makeImportAndFilePath(
      'src/services/sentry.ts',
    );

    node.addPackages({
      '@sentry/react': '7.81.1',
    });

    reactError.addErrorReporter(
      TypescriptCodeUtils.createBlock(
        `context.errorId = logErrorToSentry(error, context);`,
        [`import { logErrorToSentry } from '${sentryImport}';`],
      ),
    );

    reactConfig.getConfigMap().set('VITE_SENTRY_DSN', {
      comment: 'DSN for Sentry (optional)',
      validator: TypescriptCodeUtils.createExpression('z.string().optional()'),
      devValue: '',
    });

    authIdentify.addBlock(
      TypescriptCodeUtils.createBlock(
        `identifySentryUser({
        id: userId,
      });`,
        `import { identifySentryUser } from '${sentryImport}';`,
      ),
    );

    return {
      getProviders: () => ({
        reactSentryProvider: {
          addSentryScopeAction(block) {
            sentryFile.addCodeBlock('SENTRY_SCOPE_ACTIONS', block);
          },
        },
      }),
      build: async (builder) => {
        await builder.apply(sentryFile.renderToAction('sentry.ts', sentryPath));
      },
    };
  },
}));

const ReactSentryGenerator = createGeneratorWithTasks({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask(createMainTask(descriptor));
  },
});

export default ReactSentryGenerator;
