import {
  makeImportAndFilePath,
  nodeProvider,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { reactConfigProvider } from '../react-config';
import { reactErrorProvider } from '../react-error';

const descriptorSchema = yup.object({});

const ReactSentryGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    typescript: typescriptProvider,
    reactError: reactErrorProvider,
    reactConfig: reactConfigProvider,
    node: nodeProvider,
  },
  createGenerator(descriptor, { typescript, reactError, reactConfig, node }) {
    const sentryFile = typescript.createTemplate(
      {},
      { importMappers: [reactConfig] }
    );
    const [sentryImport, sentryPath] = makeImportAndFilePath(
      'src/services/sentry.ts'
    );

    node.addPackages({
      '@sentry/react': '^6.18.2',
      '@sentry/tracing': '^6.18.2',
    });

    reactError.addErrorReporter(
      TypescriptCodeUtils.createBlock(`captureSentryError(error);`, [
        `import { captureSentryError } from '${sentryImport}';`,
      ])
    );

    reactConfig.getConfigMap().set('REACT_APP_SENTRY_DSN', {
      comment: 'DSN for Sentry (optional)',
      validator: TypescriptCodeUtils.createExpression('yup.string()'),
      devValue: '',
    });

    return {
      build: async (builder) => {
        await builder.apply(sentryFile.renderToAction('sentry.ts', sentryPath));
      },
    };
  },
});

export default ReactSentryGenerator;
