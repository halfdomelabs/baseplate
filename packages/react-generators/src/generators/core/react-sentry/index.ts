import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  makeImportAndFilePath,
  projectScope,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '@src/constants/react-packages.js';
import { authIdentifyProvider } from '@src/generators/auth/auth-identify/index.js';

import { reactConfigProvider } from '../react-config/index.js';
import { reactErrorProvider } from '../react-error/index.js';
import { reactRouterProvider } from '../react-router/index.js';

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
  buildTasks: () => [
    createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@sentry/react']),
    }),
    createGeneratorTask({
      name: 'main',
      dependencies: {
        typescript: typescriptProvider,
        reactError: reactErrorProvider,
        reactConfig: reactConfigProvider,
        authIdentify: authIdentifyProvider.dependency().optional(),
      },
      exports: {
        reactSentry: reactSentryProvider.export(projectScope),
      },
      run({ typescript, reactError, reactConfig, authIdentify }) {
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

        reactError.addErrorReporter(
          TypescriptCodeUtils.createBlock(
            `context.errorId = logErrorToSentry(error, context);`,
            [`import { logErrorToSentry } from '${sentryImport}';`],
          ),
        );

        reactConfig.getConfigMap().set('VITE_SENTRY_DSN', {
          comment: 'DSN for Sentry (optional)',
          validator: TypescriptCodeUtils.createExpression(
            'z.string().optional()',
          ),
          devValue: '',
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
    createGeneratorTask({
      name: 'add-router-dom-integration',
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
  ],
});
