import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  TsCodeUtils,
  tsImportBuilder,
} from '@baseplate-dev/core-generators';
import {
  reactAppConfigProvider,
  reactAuthRoutesProvider,
} from '@baseplate-dev/react-generators';
import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import { z } from 'zod';

import { BETTER_AUTH_PACKAGES } from '#src/better-auth/constants/packages.js';

import { BETTER_AUTH_REACT_BETTER_AUTH_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

export const reactBetterAuthGenerator = createGenerator({
  name: 'better-auth/react-better-auth',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.paths.task,
    imports: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.imports.task,
    renderers: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.renderers.task,
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(BETTER_AUTH_PACKAGES, ['better-auth']),
    }),
    authClient: createGeneratorTask({
      dependencies: {
        renderers: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.authClient.render({}));
          },
        };
      },
    }),
    authLoadedGate: createGeneratorTask({
      dependencies: {
        renderers: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.renderers.provider,
      },
      run({ renderers }) {
        return {
          build: async (builder) => {
            await builder.apply(renderers.authLoadedGate.render({}));
          },
        };
      },
    }),
    reactAuth: createGeneratorTask({
      exports: {
        reactAuth: reactAuthRoutesProvider.export(packageScope),
      },
      run() {
        return {
          providers: {
            reactAuth: {
              getLoginUrlPath: () => '/auth/login',
              getRegisterUrlPath: () => '/auth/register',
            },
          },
        };
      },
    }),
    reactAppConfig: createGeneratorTask({
      dependencies: {
        reactAppConfig: reactAppConfigProvider,
        paths: BETTER_AUTH_REACT_BETTER_AUTH_GENERATED.paths.provider,
      },
      run({ reactAppConfig, paths }) {
        reactAppConfig.renderWrappers.set('react-better-auth', {
          wrap: (contents) =>
            TsCodeUtils.templateWithImports([
              tsImportBuilder(['AuthLoadedGate']).from(paths.authLoadedGate),
            ])`<AuthLoadedGate>${contents}</AuthLoadedGate>`,
          type: 'auth',
        });
      },
    }),
  }),
});
