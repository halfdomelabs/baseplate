import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeGitIgnoreProvider,
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
  createProviderTask,
} from '@baseplate-dev/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '#src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/index.js';
import { CORE_CONFIG_SERVICE_GENERATED } from './generated/index.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

/**
 * A field in the config service that will be added to the config schema
 */
export interface ConfigServiceField {
  /**
   * The comment to attach to the config field
   */
  comment: string;
  /**
   * The Zod validator for the config field
   */
  validator: TsCodeFragment | string;
  /**
   * The seed value that will be used in the initial .env file (if not provided, the example value will be used)
   */
  seedValue?: string;
  /**
   * The example value for the config field (used in the .env.example file)
   */
  exampleValue?: string;
}

const [setupTask, configServiceProvider, configServiceConfigValuesProvider] =
  createConfigProviderTask(
    (t) => ({
      configFields: t.mapFromObj<ConfigServiceField>({
        APP_ENVIRONMENT: {
          comment: 'Environment the app is running in',
          validator: tsCodeFragment(
            `z.enum(['dev', 'test', 'stage', 'prod'])`,
            tsImportBuilder().named('z').from('zod'),
          ),
          exampleValue: 'dev',
        },
      }),
    }),
    {
      prefix: 'config-service',
      configScope: packageScope,
    },
  );

export { configServiceProvider };

/**
 * The generator for the Fastify config service that provides a typed
 * configuration object from the .env file or environment variables.
 */
export const configServiceGenerator = createGenerator({
  name: 'core/config-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    paths: CORE_CONFIG_SERVICE_GENERATED.paths.task,
    imports: CORE_CONFIG_SERVICE_GENERATED.imports.task,
    // add the env file config to the fastify config
    fastify: createProviderTask(fastifyProvider, (fastify) => {
      fastify.nodeFlags.set('env-file', {
        flag: '--env-file-if-exists=.env',
        useCase: 'dev-env',
        targetEnvironment: 'dev',
      });
    }),
    // add the node packages
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['zod']),
    }),
    // add exclusions to the gitignore
    nodeGitIgnore: createProviderTask(
      nodeGitIgnoreProvider,
      (nodeGitIgnore) => {
        nodeGitIgnore.exclusions.set('config', ['/.env', '/.*.env']);
      },
    ),
    setup: setupTask,
    // create the config service
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        configServiceConfigValues: configServiceConfigValuesProvider,
        paths: CORE_CONFIG_SERVICE_GENERATED.paths.provider,
      },
      run({
        typescriptFile,
        configServiceConfigValues: { configFields },
        paths,
      }) {
        return {
          build: async (builder) => {
            const sortedConfigEntries = sortBy(
              [...configFields],
              [(entry) => entry[0]],
            );
            const sortedConfigFields = sortedConfigEntries.map(
              ([key, { comment, validator }]) =>
                TsCodeUtils.template`${
                  comment ? `${TsCodeUtils.formatAsComment(comment)}\n` : ''
                }${key}: ${validator},`,
            );

            await builder.apply(
              typescriptFile.renderTemplateFile({
                template: CORE_CONFIG_SERVICE_GENERATED.templates.config,
                destination: paths.config,
                variables: {
                  TPL_CONFIG_SCHEMA: TsCodeUtils.templateWithImports(
                    tsImportBuilder(['z']).from('zod'),
                  )`z.object({
                  ${TsCodeUtils.mergeFragmentsPresorted(sortedConfigFields, '\n')}
              })`,
                },
              }),
            );

            // write env example file
            const envExampleFile = `${sortedConfigEntries
              .filter(([, { exampleValue }]) => exampleValue != null)
              .map(([key, { exampleValue }]) => `${key}=${exampleValue}`)
              .join('\n')}\n`;

            builder.writeFile({
              id: 'env-example',
              destination: '.env.example',
              contents: envExampleFile,
            });

            // write env file
            const envFile = `${sortedConfigEntries
              .filter(
                ([, { seedValue, exampleValue }]) =>
                  (seedValue ?? exampleValue) !== undefined,
              )
              .map(
                ([key, { seedValue, exampleValue }]) =>
                  `${key}=${seedValue ?? exampleValue}`,
              )
              .join('\n')}\n`;

            builder.writeFile({
              id: 'env',
              destination: '.env',
              contents: envFile,
              options: {
                shouldNeverOverwrite: true,
              },
            });
          },
        };
      },
    }),
  }),
});
