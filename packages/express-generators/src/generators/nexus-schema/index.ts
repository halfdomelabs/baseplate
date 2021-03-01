import {
  createTypescriptTemplateConfig,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import { paramCase } from 'change-case';
import * as yup from 'yup';
import { expressFeatureProvider } from '../feature';

interface NexusSchemaDescriptor extends GeneratorDescriptor {
  name: string;
}

const descriptorSchema = {
  name: yup.string().required(),
};

const SCHEMA_FILE_CONFIG = createTypescriptTemplateConfig({
  FIELDS: { type: 'code-block' },
});

export type NexusSchemaProvider = {
  getSchemaFile(): TypescriptSourceFile<typeof SCHEMA_FILE_CONFIG>;
};

export const nexusSchemaProvider = createProviderType<NexusSchemaProvider>(
  'nexus-schema'
);

const NexusSchemaGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusSchemaDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    expressFeature: expressFeatureProvider,
  },
  exports: {
    nexusSchema: nexusSchemaProvider,
  },
  childGenerators: {
    fields: { multiple: true },
  },
  createGenerator(descriptor, { expressFeature }) {
    const file = new TypescriptSourceFile(SCHEMA_FILE_CONFIG);
    const moduleName = paramCase(descriptor.name);
    const path = `${expressFeature.getFeatureFolder()}/schemas/${moduleName}.ts`;

    expressFeature.addFeatureEntry('schema', {
      expression: `require('./schemas/${moduleName}')`,
    });

    return {
      getProviders: () => ({
        nexusSchema: {
          getSchemaFile: () => file,
        },
      }),
      build: (context) => {
        context.addAction(file.renderToAction('FIELDS', path));
      },
    };
  },
});

export default NexusSchemaGenerator;
