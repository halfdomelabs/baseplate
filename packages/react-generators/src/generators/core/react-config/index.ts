import {
  ImportMapper,
  nodeProvider,
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

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

interface ConfigEntry {
  comment: string;
  validator: TypescriptCodeExpression;
  devValue: string;
}

export interface ReactConfigProvider extends ImportMapper {
  getConfigMap(): NonOverwriteableMap<Record<string, ConfigEntry>>;
  addEnvVar(name: string, value: string): void;
}

export const reactConfigProvider =
  createProviderType<ReactConfigProvider>('react-config');

const ReactConfigGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    node: nodeProvider,
    typescript: typescriptProvider,
  },
  exports: {
    reactConfig: reactConfigProvider,
  },
  createGenerator(descriptor, { node, typescript }) {
    const configEntryMap = createNonOverwriteableMap<
      Record<string, ConfigEntry>
    >({}, { name: 'react-config-entries' });
    const customEnvVars: { name: string; value: string }[] = [];

    node.addPackages({
      yup: '^0.32.11',
    });
    return {
      getProviders: () => ({
        reactConfig: {
          addEnvVar(name, value) {
            customEnvVars.push({ name, value });
          },
          getConfigMap: () => configEntryMap,
          getImportMap: () => ({
            '%react-config': {
              path: '@/src/services/config',
              allowedImports: ['config'],
            },
          }),
        },
      }),
      build: async (builder) => {
        const configFile = typescript.createTemplate({
          CONFIG_SCHEMA: { type: 'code-expression' },
        });

        const configEntries = configEntryMap.value();
        const configEntryKeys = Object.keys(configEntries);
        const mergedExpression = TypescriptCodeUtils.mergeExpressions(
          configEntryKeys.map((key) => {
            const { comment, validator } = configEntries[key];
            return TypescriptCodeUtils.formatExpression(
              `${
                comment
                  ? `${TypescriptCodeUtils.formatAsComment(comment)}\n`
                  : ''
              }${key}: VALIDATOR,`,
              {
                VALIDATOR: validator,
              }
            );
          }),
          '\n'
        );

        configFile.addCodeExpression(
          'CONFIG_SCHEMA',
          mergedExpression.wrap((contents) => `{${contents}}`)
        );

        await builder.apply(
          configFile.renderToAction(
            'services/config.ts',
            'src/services/config.ts'
          )
        );

        const configVars = Object.entries(configEntries).map(
          ([key, { devValue }]) => ({ name: key, value: devValue })
        );

        const devEnvVars = [...configVars, ...customEnvVars];

        if (devEnvVars.length) {
          const developmentEnvFile = `${devEnvVars
            .map(({ name, value }) => `${name}=${value}`)
            .join('\n')}\n`;

          builder.writeFile('.env.development', developmentEnvFile);
        }
      },
    };
  },
});

export default ReactConfigGenerator;
