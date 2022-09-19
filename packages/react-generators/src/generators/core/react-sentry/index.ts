import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import { z } from 'zod';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify';
import { reactConfigProvider } from '../react-config';
import { reactErrorProvider } from '../react-error';

const descriptorSchema = z.object({});

const ReactSentryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactError: reactErrorProvider,
    reactConfig: reactConfigProvider,
    node: nodeProvider,
    authIdentify: authIdentifyProvider,
  },
  createGenerator(
    descriptor,
    { typescript, reactError, reactConfig, node, authIdentify }
  ) {
    const sentryFile = typescript.createTemplate(
      {},
      { importMappers: [reactConfig] }
    );
    const [sentryImport, sentryPath] = makeImportAndFilePath(
      'src/services/sentry.ts'
    );

    node.addPackages({
      '@sentry/react': '7.7.0',
      '@sentry/tracing': '7.7.0',
    });

    reactError.addErrorReporter(
      TypescriptCodeUtils.createBlock(`captureSentryError(error);`, [
        `import { captureSentryError } from '${sentryImport}';`,
      ])
    );

    reactConfig.getConfigMap().set('REACT_APP_SENTRY_DSN', {
      comment: 'DSN for Sentry (optional)',
      validator: TypescriptCodeUtils.createExpression('z.string().optional()'),
      devValue: '',
    });

    authIdentify.addBlock(
      TypescriptCodeUtils.createBlock(
        `identifySentryUser({
        id: user.id,
        email: user.email,
      });`,
        `import { identifySentryUser } from '${sentryImport}';`
      )
    );

    return {
      build: async (builder) => {
        await builder.apply(sentryFile.renderToAction('sentry.ts', sentryPath));
      },
    };
  },
});

export default ReactSentryGenerator;
