import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';

import { reactConfigProvider } from '../react-config/index.js';
import { reactErrorProvider } from '../react-error/index.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/index.js';

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
    { typescript, reactError, reactConfig, node, authIdentify },
  ) {
    const sentryFile = typescript.createTemplate(
      {},
      { importMappers: [reactConfig] },
    );
    const [sentryImport, sentryPath] = makeImportAndFilePath(
      'src/services/sentry.ts',
    );

    node.addPackages({
      '@sentry/react': '7.81.1',
    });

    reactError.addErrorReporter(
      TypescriptCodeUtils.createBlock(`captureSentryError(error);`, [
        `import { captureSentryError } from '${sentryImport}';`,
      ]),
    );

    reactConfig.getConfigMap().set('VITE_SENTRY_DSN', {
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
        `import { identifySentryUser } from '${sentryImport}';`,
      ),
    );

    return {
      build: async (builder) => {
        await builder.apply(sentryFile.renderToAction('sentry.ts', sentryPath));
      },
    };
  },
});

export default ReactSentryGenerator;
