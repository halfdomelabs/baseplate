import {
  createTypescriptTemplateConfig,
  nodeProvider,
  TypescriptCodeExpression,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
  createNonOverwriteableMap,
  writeFileAction,
} from '@baseplate/sync';
import * as R from 'ramda';
import * as yup from 'yup';
import { expressProvider } from '../express';
import { writeEnvFile } from './actions/writeEnvFile';

interface ExpressConfigDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

const CONFIG_FILE_CONFIG = createTypescriptTemplateConfig({
  CONFIG_HEADER: { type: 'code-block' },
  // TODO: Find way to specify config is private
  CONFIG_SCHEMA_OBJECT: { type: 'code-expression' },
});

interface ConfigEntry {
  default?: string;
  description: string;
  excludeFromEnvFile?: boolean;
  validation: TypescriptCodeExpression;
}

export interface ExpressConfigProvider {
  getConfigFile(): TypescriptSourceFile<typeof CONFIG_FILE_CONFIG>;
  addConfigEntries(entries: Record<string, ConfigEntry>): void;
}

export const expressConfigProvider = createProviderType<ExpressConfigProvider>(
  'express-config'
);

const ExpressConfigGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ExpressConfigDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    node: nodeProvider,
    express: expressProvider,
  },
  exports: {
    config: expressConfigProvider,
  },
  createGenerator(descriptor, { node, express }) {
    const configEntries = createNonOverwriteableMap<
      Record<string, ConfigEntry>
    >({}, 'express-config');
    const configFile = new TypescriptSourceFile(CONFIG_FILE_CONFIG);
    node.addPackages({
      dotenv: '^8.2.0',
      yup: '^0.32.8',
    });

    // add port entry
    configFile.addCodeBlock('CONFIG_HEADER', {
      code: 'const DEFAULT_PORT=4000;',
    });
    configEntries.merge({
      PORT: {
        excludeFromEnvFile: true,
        description: 'Port to listen on',
        validation: { expression: 'yup.number().default(DEFAULT_PORT)' },
      },
    });
    express.getServerFile().addCodeExpression('PORT', {
      expression: 'config.PORT',
      importText: ["import config from '@/src/config'"],
    });
    return {
      getProviders: () => ({
        config: {
          getConfigFile: () => configFile,
          addConfigEntries(entries) {
            configEntries.merge(entries);
          },
        },
      }),
      build: async (context) => {
        configFile.addCodeExpression(
          'CONFIG_SCHEMA_OBJECT',
          TypescriptCodeUtils.mergeExpressionsAsObject(
            R.mapObjIndexed((value) => value.validation, configEntries.value())
          )
        );

        const configTemplate = await readTemplate(__dirname, 'config.ts');
        context.addAction(
          configFile.renderToAction(configTemplate, 'src/config.ts')
        );

        const envEntries = Object.entries(configEntries.value()).filter(
          ([, value]) => !value.excludeFromEnvFile
        );

        // write .env.example file
        context.addAction(
          writeFileAction({
            contents: envEntries
              .map(([key, value]) => `${key}=${value.description}`)
              .join('\n'),
            destination: '.env.example',
          })
        );

        // merge in new defaults to .env file
        context.addAction(
          writeEnvFile({
            defaults: R.fromPairs(
              envEntries.map(([key, value]) => [
                key,
                value.default || value.description,
              ])
            ),
            envFilePath: '.env',
          })
        );
      },
    };
  },
});

export default ExpressConfigGenerator;
