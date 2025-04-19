import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  tsCodeFragment,
  tsImportBuilder,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/auth-identify.generator.js';

import { reactConfigProvider } from '../react-config/react-config.generator.js';
import { reactErrorConfigProvider } from '../react-error/react-error.generator.js';
import { reactRouterProvider } from '../react-router/react-router.generator.js';

const descriptorSchema = z.object({});

export interface ReactSentryProvider {
  addSentryScopeAction(block: TypescriptCodeBlock): void;
}

export const reactSentryProvider =
  createProviderType<ReactSentryProvider>('react-sentry');

export const reactSentryGenerator = createGenerator({
  name: 'core/react-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@sentry/react']),
    }),
    reactError: createProviderTask(
      reactErrorConfigProvider,
      (reactErrorConfig) => {
        reactErrorConfig.errorReporters.set(
          'sentry',
          tsCodeFragment(
            `context.errorId = logErrorToSentry(error, context);`,
            tsImportBuilder(['logErrorToSentry']).from(
              '@/src/services/sentry.ts',
            ),
          ),
        );
      },
    ),
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
        reactConfig: reactConfigProvider,
        authIdentify: authIdentifyProvider.dependency().optional(),
      },
      exports: {
        reactSentry: reactSentryProvider.export(projectScope),
      },
      run({ typescript, reactConfig, authIdentify }) {
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

        reactConfig.configEntries.set('VITE_SENTRY_DSN', {
          comment: 'DSN for Sentry (optional)',
          validator: 'z.string().optional()',
          devDefaultValue: '',
        });

        if (authIdentify) {
          authIdentify.addBlock(
            TypescriptCodeUtils.createBlock(
              `identifySentryUser({
        id: userId,
      });`,
              `import { identifySentryUser } from '${sentryImport}';`,
            ),
          );
        }

        return {
          providers: {
            reactSentry: {
              addSentryScopeAction(block) {
                sentryFile.addCodeBlock('SENTRY_SCOPE_ACTIONS', block);
              },
            },
          },
          build: async (builder) => {
            await builder.apply(
              sentryFile.renderToAction('sentry.ts', sentryPath),
            );
          },
        };
      },
    }),
    addRouterDomIntegration: createGeneratorTask({
      dependencies: {
        reactRouter: reactRouterProvider,
      },
      run({ reactRouter }) {
        reactRouter.setRoutesComponent(
          TypescriptCodeUtils.createExpression('SentryRoutes', [], {
            headerBlocks: [
              TypescriptCodeUtils.createBlock(
                `const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);`,
                [
                  "import * as Sentry from '@sentry/react'",
                  "import { Routes } from 'react-router-dom'",
                ],
              ),
            ],
          }),
        );
        return {};
      },
    }),
  }),
});
