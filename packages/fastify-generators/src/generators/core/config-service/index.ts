import type {
  ImportMapper,
  TypescriptCodeBlock,
} from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  createNodePackagesTask,
  extractPackageVersions,
  mergeCodeEntryOptions,
  nodeGitIgnoreProvider,
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderTask,
  createProviderType,
} from '@halfdomelabs/sync';
import { sortBy } from 'es-toolkit';
import { z } from 'zod';

import { FASTIFY_PACKAGES } from '@src/constants/fastify-packages.js';

import { fastifyProvider } from '../fastify/index.js';
import {
  configServiceImportsProvider,
  createConfigServiceImportMap,
} from './generated/import-maps.js';

const descriptorSchema = z.object({
  placeholder: z.string().optional(),
});

interface ConfigEntry {
  comment: string;
  value: TypescriptCodeExpression | string;
  seedValue?: string;
  exampleValue?: string;
}

export interface ConfigServiceProvider extends ImportMapper {
  getConfigEntries(): NonOverwriteableMap<Record<string, ConfigEntry>>;
  addAdditionalVerification(codeBlock: TypescriptCodeBlock): void;
  getConfigExpression(): TypescriptCodeExpression;
}

export const configServiceProvider =
  createProviderType<ConfigServiceProvider>('config-service');

export const configServiceGenerator = createGenerator({
  name: 'core/config-service',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: () => ({
    // add the dotenv config to the fastify config
    fastify: createProviderTask(fastifyProvider, (fastify) => {
      fastify.getConfig().appendUnique('nodeFlags', [
        {
          flag: '-r dotenv/config',
          useCase: 'dev-env',
          targetEnvironment: 'dev',
        },
      ]);
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
        nodeGitIgnore.addExclusions(['/.env', '/.*.env']);
      },
    ),
    // create the config service
    main: createGeneratorTask({
      dependencies: {
        typescript: typescriptProvider,
      },
      exports: {
        configService: configServiceProvider.export(projectScope),
        configServiceImports: configServiceImportsProvider.export(projectScope),
      },
      run({ typescript }) {
        const configEntries = createNonOverwriteableMap<
          Record<string, ConfigEntry>
        >({}, { name: 'config-service-config-entries' });
        const additionalVerifications: TypescriptCodeBlock[] = [];

        configEntries.set('APP_ENVIRONMENT', {
          comment: 'Environment the app is running in',
          value: TypescriptCodeUtils.createExpression(
            `z.enum(['development', 'test', 'staging', 'production'])`,
            "import { z } from 'zod'",
          ),
          exampleValue: 'development',
        });

        return {
          providers: {
            configService: {
              getConfigEntries: () => configEntries,
              addAdditionalVerification: (codeBlock) => {
                additionalVerifications.push(codeBlock);
              },
              getConfigExpression: () =>
                TypescriptCodeUtils.createExpression(
                  'config',
                  "import { config } from '@/src/services/config.js'",
                ),
              getImportMap: () => ({
                '%config': {
                  path: '@/src/services/config.js',
                  allowedImports: ['config'],
                },
              }),
            },
            configServiceImports: createConfigServiceImportMap({
              service: '@/src/services/config.js',
            }),
          },
          build: async (builder) => {
            const configFile = typescript.createTemplate({
              CONFIG_OBJECT: { type: 'code-expression' },
              ADDITIONAL_VERIFICATIONS: { type: 'code-block' },
            });

            const configEntriesObj = configEntries.value();
            const sortedConfigEntries = sortBy(
              Object.entries(configEntriesObj),
              [(entry) => entry[0]],
            );
            const configEntryKeys = Object.keys(configEntriesObj).sort();
            const mergedExpression = configEntryKeys
              .map((key) => {
                const { comment, value } = configEntriesObj[key];
                return `${
                  comment
                    ? `${TypescriptCodeUtils.formatAsComment(comment)}\n`
                    : ''
                }${key}: ${typeof value === 'string' ? value : value.content},`;
              })
              .join('\n');

            configFile.addCodeExpression(
              'CONFIG_OBJECT',
              new TypescriptCodeExpression(
                `{\n${mergedExpression}\n}`,
                null,
                mergeCodeEntryOptions(
                  Object.values(configEntriesObj).map((e) => e.value),
                ),
              ),
            );

            configFile.addCodeBlock(
              'ADDITIONAL_VERIFICATIONS',
              TypescriptCodeUtils.mergeBlocks(additionalVerifications),
            );

            await builder.apply(
              configFile.renderToAction('config.ts', 'src/services/config.ts'),
            );

            const envExampleFile = `${sortedConfigEntries
              .filter(([, { exampleValue }]) => exampleValue != null)
              .map(([key, { exampleValue }]) => `${key}=${exampleValue}`)
              .join('\n')}\n`;

            const envFile = `${sortedConfigEntries
              .filter(
                ([, { seedValue, exampleValue }]) =>
                  (seedValue ?? exampleValue) != null,
              )
              .map(
                ([key, { seedValue, exampleValue }]) =>
                  `${key}=${seedValue ?? exampleValue ?? ''}`,
              )
              .join('\n')}\n`;

            builder.writeFile({
              id: 'env-example',
              destination: '.env.example',
              contents: envExampleFile,
            });
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

export { configServiceImportsProvider } from './generated/import-maps.js';
