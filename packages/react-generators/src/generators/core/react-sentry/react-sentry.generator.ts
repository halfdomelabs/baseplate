import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { authIdentifyProvider } from '#src/generators/auth/auth-identify/auth-identify.generator.js';

import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '../react-config/react-config.generator.js';
import { reactErrorConfigProvider } from '../react-error/react-error.generator.js';
import { reactRouterConfigProvider } from '../react-router/react-router.generator.js';
import {
  createReactSentryImports,
  reactSentryImportsProvider,
} from './generated/ts-import-maps.js';
import { CORE_REACT_SENTRY_TS_TEMPLATES } from './generated/ts-templates.js';

const descriptorSchema = z.object({});

const [setupTask, reactSentryConfigProvider, reactSentryConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      sentryScopeActions: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'react-sentry',
      configScope: projectScope,
    },
  );

export { reactSentryConfigProvider };

const sentryPath = '@/src/services/sentry.ts';

export const reactSentryGenerator = createGenerator({
  name: 'core/react-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
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
    reactConfig: createProviderTask(reactConfigProvider, (reactConfig) => {
      reactConfig.configEntries.set('VITE_SENTRY_DSN', {
        comment: 'DSN for Sentry (optional)',
        validator: 'z.string().optional()',
        devDefaultValue: '',
      });
    }),
    authIdentify: createProviderTask(
      authIdentifyProvider.dependency().optional(),
      (authIdentify) => {
        if (authIdentify) {
          authIdentify.identifyFragments.set(
            'identify-sentry-user',
            tsCodeFragment(
              `identifySentryUser({
      id: userId,
    });`,
              tsImportBuilder(['identifySentryUser']).from(sentryPath),
            ),
          );
        }
      },
    ),
    imports: createGeneratorTask({
      exports: {
        reactSentryImports: reactSentryImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            reactSentryImports: createReactSentryImports('@/src/services'),
          },
        };
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactConfigImports: reactConfigImportsProvider,
        reactSentryConfigValues: reactSentryConfigValuesProvider,
      },
      run({
        typescriptFile,
        reactConfigImports,
        reactSentryConfigValues: { sentryScopeActions },
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_SENTRY_TS_TEMPLATES.sentry,
                destination: sentryPath,
                importMapProviders: {
                  reactConfigImports,
                },
                variables: {
                  TPL_SENTRY_SCOPE_ACTIONS:
                    TsCodeUtils.mergeFragments(sentryScopeActions),
                },
              }),
            );
          },
        };
      },
    }),
    addRouterDomIntegration: createGeneratorTask({
      dependencies: {
        reactRouterConfig: reactRouterConfigProvider,
      },
      run({ reactRouterConfig }) {
        reactRouterConfig.routesComponent.set(
          tsCodeFragment('SentryRoutes', undefined, {
            hoistedFragments: [
              tsHoistedFragment(
                'sentry-routes',
                `const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);`,
                [
                  tsImportBuilder().namespace('Sentry').from('@sentry/react'),
                  tsImportBuilder(['Routes']).from('react-router-dom'),
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

export { reactSentryImportsProvider } from './generated/ts-import-maps.js';
