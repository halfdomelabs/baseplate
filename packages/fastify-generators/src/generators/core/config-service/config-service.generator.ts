import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import {
  createNodePackagesTask,
  extractPackageVersions,
  nodeGitIgnoreProvider,
  projectScope,
  tsCodeFragment,
  TsCodeUtils,
  tsImportBuilder,
  typescriptFileProvider,
} from '@halfdomelabs/core-generators';
import {
  createConfigProviderTask,
  createGenerator,
  createGeneratorTask,
  createProviderTask,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/fastify.generator.js';
import {
  configServiceImportsProvider,
  createConfigServiceImports,
} from './generated/ts-import-maps.js';
import { CORE_CONFIG_SERVICE_TS_TEMPLATES } from './generated/ts-templates.js';

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
            `z.enum(['development', 'test', 'staging', 'production'])`,
            tsImportBuilder().named('z').from('zod'),
          ),
          exampleValue: 'development',
        },
      }),
    }),
    {
      prefix: 'config-service',
      configScope: projectScope,
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
    // add the dotenv config to the fastify config
    fastify: createProviderTask(fastifyProvider, (fastify) => {
      fastify.nodeFlags.set('dotenv', {
        flag: '-r dotenv/config',
        useCase: 'dev-env',
        targetEnvironment: 'dev',
      });
    }),
    // add the node packages
    nodePackages: createNodePackagesTask({
      prod: extractPackageVersions(FASTIFY_PACKAGES, ['zod', 'cross-env']),
      dev: extractPackageVersions(FASTIFY_PACKAGES, ['dotenv']),
    }),
    // add exclusions to the gitignore
    nodeGitIgnore: createProviderTask(
      nodeGitIgnoreProvider,
      (nodeGitIgnore) => {
        nodeGitIgnore.exclusions.set('config', ['/.env', '/.*.env']);
      },
    ),
    setup: setupTask,
    imports: createGeneratorTask({
      exports: {
        configServiceImports: configServiceImportsProvider.export(projectScope),
      },
      run() {
        return {
          providers: {
            configServiceImports: createConfigServiceImports('@/src/services'),
          },
        };
      },
    }),
    // create the config service
    main: createGeneratorTask({
      dependencies: {
        typescriptFile: typescriptFileProvider,
        configServiceConfigValues: configServiceConfigValuesProvider,
      },
      run({ typescriptFile, configServiceConfigValues: { configFields } }) {
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
                template: CORE_CONFIG_SERVICE_TS_TEMPLATES.config,
                destination: 'src/services/config.ts',
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

export { configServiceImportsProvider } from './generated/ts-import-maps.js';
