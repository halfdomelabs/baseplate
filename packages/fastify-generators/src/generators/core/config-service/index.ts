import {
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
import * as yup from 'yup';
import { fastifyProvider } from '../fastify';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

interface ConfigEntry {
  comment: string;
  value: TypescriptCodeExpression;
  exampleValue?: string;
}

export interface ConfigServiceProvider {
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
      yup: '^0.32.11',
    });

    node.addDevPackages({
      dotenv: '^10.0.0',
    });

    nodeGitIgnore.addExclusions(['/.env', '/.*.env']);

    fastify.getConfig().appendUnique('devLoaders', ['dotenv/config']);

    configEntries.set('APP_ENVIRONMENT', {
      comment: 'Environment the app is running in',
      value: TypescriptCodeUtils.createExpression(
        `yup
      .mixed<'development' | 'staging' | 'production'>()
      .oneOf(['development', 'staging', 'production'])
      .required()`,
        "import * as yup from 'yup'"
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
            }${key}: ${value.content},`;
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

        const envFile = `${Object.entries(configEntriesObj)
          .filter(([, { exampleValue }]) => exampleValue)
          .map(([key, { exampleValue }]) => `${key}=${exampleValue as string}`)
          .join('\n')}\n`;

        builder.writeFile('.env.example', envFile);
        builder.writeFile('.env', envFile, {
          neverOverwrite: true,
        });
      },
    };
  },
});

export default ConfigServiceGenerator;
