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
} from '@baseplate/sync';
import * as yup from 'yup';
import { expressProvider } from '../express';

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

export interface ExpressConfigProvider {
  getConfigFile(): TypescriptSourceFile<typeof CONFIG_FILE_CONFIG>;
  addConfigEntries(entries: Record<string, TypescriptCodeExpression>): void;
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
      Record<string, TypescriptCodeExpression>
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
      PORT: { expression: 'yup.number().default(DEFAULT_PORT)' },
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
          TypescriptCodeUtils.mergeExpressionsAsObject(configEntries.value())
        );

        const configTemplate = await readTemplate(__dirname, 'config.ts');
        context.addAction(
          configFile.renderToAction(configTemplate, 'src/config.ts')
        );
      },
    };
  },
});

export default ExpressConfigGenerator;
