import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsHoistedFragment,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { REACT_PACKAGES } from '#src/constants/react-packages.js';
import { authIdentifyProvider } from '#src/generators/auth/auth-identify/index.js';

import {
  reactConfigImportsProvider,
  reactConfigProvider,
} from '../react-config/index.js';
import { reactErrorConfigProvider } from '../react-error/index.js';
import { reactRouterConfigProvider } from '../react-router/index.js';
import { CORE_REACT_SENTRY_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [setupTask, reactSentryConfigProvider, reactSentryConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      sentryScopeActions: t.map<string, TsCodeFragment>(),
    }),
    {
      prefix: 'react-sentry',
      configScope: packageScope,
    },
  );

export { reactSentryConfigProvider };

export const reactSentryGenerator = createGenerator({
  name: 'core/react-sentry',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    setup: setupTask,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(REACT_PACKAGES, ['@sentry/react']),
    }),
    paths: CORE_REACT_SENTRY_GENERATED.paths.task,
    imports: CORE_REACT_SENTRY_GENERATED.imports.task,
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
    authIdentify: createGeneratorTask({
      dependencies: {
        authIdentify: authIdentifyProvider.dependency().optional(),
        paths: CORE_REACT_SENTRY_GENERATED.paths.provider,
      },
      run({ authIdentify, paths }) {
        if (authIdentify) {
          authIdentify.identifyFragments.set(
            'identify-sentry-user',
            tsCodeFragment(
              `identifySentryUser({
      id: userId,
    });`,
              tsImportBuilder(['identifySentryUser']).from(paths.sentry),
            ),
          );
        }
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        reactConfigImports: reactConfigImportsProvider,
        reactSentryConfigValues: reactSentryConfigValuesProvider,
        paths: CORE_REACT_SENTRY_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        reactConfigImports,
        reactSentryConfigValues: { sentryScopeActions },
        paths,
      }) {
        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_REACT_SENTRY_GENERATED.templates.sentry,
                destination: paths.sentry,
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
