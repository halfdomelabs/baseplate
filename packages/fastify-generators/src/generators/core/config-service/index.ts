import {
  ImportMapper,
  mergeCodeEntryOptions,
  nodeGitIgnoreProvider,
  nodeProvider,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  typescriptProvider,
} from '@baseplate/core-generators';
import {
  createProviderType,
  createGeneratorWithChildren,
  NonOverwriteableMap,
  createNonOverwriteableMap,
} from '@baseplate/sync';
import { z } from 'zod';
import { fastifyProvider } from '../fastify';

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

const ConfigServiceGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    nodeGitIgnore: nodeGitIgnoreProvider,
    fastify: fastifyProvider,
    typescript: typescriptProvider,
  },
  exports: {
    configService: configServiceProvider,
  },
  createGenerator(descriptor, { node, nodeGitIgnore, fastify, typescript }) {
    const configEntries = createNonOverwriteableMap<
      Record<string, ConfigEntry>
    >({}, { name: 'config-service-config-entries' });
    const additionalVerifications: TypescriptCodeBlock[] = [];

    node.addPackages({
      zod: '3.17.3',
    });

    node.addDevPackages({
      dotenv: '^10.0.0',
    });

    nodeGitIgnore.addExclusions(['/.env', '/.*.env']);

    fastify.getConfig().appendUnique('devLoaders', ['dotenv/config']);

    configEntries.set('APP_ENVIRONMENT', {
      comment: 'Environment the app is running in',
      value: TypescriptCodeUtils.createExpression(
        `z.enum(['development', 'test', 'staging', 'production'])`,
        "import { z } from 'zod'"
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
              "import { config } from '@/src/services/config'"
            ),
          getImportMap: () => ({
            '%config': {
              path: '@/src/services/config',
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
        const configEntryKeys = Object.keys(configEntriesObj);
        const mergedExpression = configEntryKeys
          .map((key) => {
            const { comment, value } = configEntriesObj[key];
            return `${
              comment ? `${TypescriptCodeUtils.formatAsComment(comment)}\n` : ''
            }${key}: ${typeof value === 'string' ? value : value.content},`;
          })
          .join('\n');

        configFile.addCodeExpression(
          'CONFIG_OBJECT',
          new TypescriptCodeExpression(
            `{\n${mergedExpression}\n}`,
            null,
            mergeCodeEntryOptions(
              Object.values(configEntriesObj).map((e) => e.value)
            )
          )
        );

        configFile.addCodeBlock(
          'ADDITIONAL_VERIFICATIONS',
          TypescriptCodeUtils.mergeBlocks(additionalVerifications)
        );

        await builder.apply(
          configFile.renderToAction('config.ts', 'src/services/config.ts')
        );

        const envExampleFile = `${Object.entries(configEntriesObj)
          .filter(([, { exampleValue }]) => exampleValue != null)
          .map(([key, { exampleValue }]) => `${key}=${exampleValue as string}`)
          .join('\n')}\n`;

        const envFile = `${Object.entries(configEntriesObj)
          .filter(
            ([, { seedValue, exampleValue }]) =>
              (seedValue || exampleValue) != null
          )
          .map(
            ([key, { seedValue, exampleValue }]) =>
              `${key}=${seedValue ?? exampleValue ?? ''}`
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

export default ConfigServiceGenerator;
