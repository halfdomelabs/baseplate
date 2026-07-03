import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  packageScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@baseplate-dev/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
} from '@baseplate-dev/sync';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyServerConfigProvider } from '../fastify-server/index.js';
import { loggerServiceConfigProvider } from '../logger-service/index.js';
import { CORE_REQUEST_CONTEXT_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({});

const [
  setupTask,
  requestContextConfigProvider,
  requestContextConfigValuesProvider,
] = createConfigProviderTask(
  (t) => ({
    /**
     * Additional properties to add to the FastifyRequest interface augmentation.
     */
    fastifyRequestAugmentations: t.map<string, TsCodeFragment>(),
    /**
     * Additional fastify.decorateRequest() calls.
     */
    decoratorRegistrations: t.map<string, TsCodeFragment>(),
    /**
     * Additional hooks to register on the fastify instance.
     */
    extraHooks: t.map<string, TsCodeFragment>(),
  }),
  {
    prefix: 'request-context',
    configScope: packageScope,
  },
);

export { requestContextConfigProvider };

export const requestContextGenerator = createGenerator({
  name: 'core/request-context',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_REQUEST_CONTEXT_GENERATED.paths.task,
    imports: CORE_REQUEST_CONTEXT_GENERATED.imports.task,
    setup: setupTask,
    loggerRequestContext: createGeneratorTask({
      dependencies: { loggerServiceConfig: loggerServiceConfigProvider },
      run({ loggerServiceConfig }) {
        loggerServiceConfig.mixins.set(
          'reqId',
          tsCodeFragment(
            "requestContext.get('reqInfo')?.id",
            tsImportBuilder()
              .named('requestContext')
              .from('@fastify/request-context'),
          ),
        );

        return {};
      },
    }),
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, [
        '@fastify/request-context',
      ]),
    }),
    fastifyServerConfig: createGeneratorTask({
      dependencies: {
        fastifyServerConfig: fastifyServerConfigProvider,
        paths: CORE_REQUEST_CONTEXT_GENERATED.paths.provider,
      },
      run({ fastifyServerConfig, paths }) {
        fastifyServerConfig.plugins.set('requestContextPlugin', {
          plugin: tsCodeFragment(
            'requestContextPlugin',
            tsImportBuilder(['requestContextPlugin']).from(
              paths.requestContext,
            ),
          ),
        });
      },
    }),
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        paths: CORE_REQUEST_CONTEXT_GENERATED.paths.provider,
        requestContextConfigValues: requestContextConfigValuesProvider,
      },
      run({ typescriptFile, paths, requestContextConfigValues }) {
        const {
          fastifyRequestAugmentations,
          decoratorRegistrations,
          extraHooks,
        } = requestContextConfigValues;

        return {
          build: async (builder) => {
            await builder.apply(
              typescriptFile.renderTemplateFile({
                template:
                  CORE_REQUEST_CONTEXT_GENERATED.templates.requestContext,
                destination: paths.requestContext,
                variables: {
                  TPL_FASTIFY_REQUEST_AUGMENTATIONS:
                    TsCodeUtils.mergeFragmentsAsInterfaceContent(
                      fastifyRequestAugmentations,
                    ),
                  TPL_DECORATOR_REGISTRATIONS: TsCodeUtils.mergeFragments(
                    decoratorRegistrations,
                  ),
                  TPL_EXTRA_HOOKS: TsCodeUtils.mergeFragments(
                    extraHooks,
                    '\n\n',
                  ),
                },
              }),
            );
          },
        };
      },
    }),
  }),
});
