import type {
  ImportMapper,
  TypescriptCodeBlock,
} from '@halfdomelabs/core-generators';
import type { NonOverwriteableMap } from '@halfdomelabs/sync';

import {
  mergeCodeEntryOptions,
  nodeGitIgnoreProvider,
  nodeProvider,
  projectScope,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@halfdomelabs/core-generators';
import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
} from '@halfdomelabs/sync';
import * as R from 'ramda';
import { z } from 'zod';

import { fastifyProvider } from '../fastify/index.js';

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
  buildTasks(taskBuilder) {
    taskBuilder.addTask({
      name: 'fastify',
      dependencies: {
        fastify: fastifyProvider,
      },
      run({ fastify }) {
        fastify.getConfig().appendUnique('nodeFlags', [
          {
            flag: '-r dotenv/config',
            useCase: 'dev-env',
            targetEnvironment: 'dev',
          },
        ]);

        return {};
      },
    });

    taskBuilder.addTask({
      name: 'main',
      dependencies: {
        node: nodeProvider,
        nodeGitIgnore: nodeGitIgnoreProvider,
        typescript: typescriptProvider,
      },
      exports: { configService: configServiceProvider.export(projectScope) },
      run({ node, nodeGitIgnore, typescript }) {
        const configEntries = createNonOverwriteableMap<
          Record<string, ConfigEntry>
        >({}, { name: 'config-service-config-entries' });
        const additionalVerifications: TypescriptCodeBlock[] = [];

        node.addPackages({
          zod: '3.24.1',
          'cross-env': '7.0.3',
        });

        node.addDevPackages({
          dotenv: '16.3.1',
        });

        nodeGitIgnore.addExclusions(['/.env', '/.*.env']);

        configEntries.set('APP_ENVIRONMENT', {
          comment: 'Environment the app is running in',
          value: TypescriptCodeUtils.createExpression(
            `z.enum(['development', 'test', 'staging', 'production'])`,
            "import { z } from 'zod'",
          ),
          exampleValue: 'development',
        });

        return {
          getProviders: () => ({
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
          }),
          build: async (builder) => {
            const configFile = typescript.createTemplate({
              CONFIG_OBJECT: { type: 'code-expression' },
              ADDITIONAL_VERIFICATIONS: { type: 'code-block' },
            });

            const configEntriesObj = configEntries.value();
            const sortedConfigEntries = R.sortBy(
              (entry) => entry[0],
              Object.entries(configEntriesObj),
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

            builder.writeFile('.env.example', envExampleFile);
            builder.writeFile('.env', envFile, {
              neverOverwrite: true,
            });
          },
        };
      },
    });
  },
});
