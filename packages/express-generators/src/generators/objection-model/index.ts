import {
  createTypescriptTemplateConfig,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptSourceFile,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
} from '@baseplate/sync';
import { paramCase, pascalCase, snakeCase } from 'change-case';
import * as yup from 'yup';
import { objectionFeatureProvider } from '../objection-feature';

interface ObjectionModelDescriptor extends GeneratorDescriptor {
  name: string;
}

const descriptorSchema = {
  name: yup.string(),
};

export type ObjectionModelProvider = {
  addField: (field: TypescriptCodeBlock) => void;
};

export const objectionModelProvider = createProviderType<ObjectionModelProvider>(
  'objection-model'
);

const MODEL_FILE_CONFIG = createTypescriptTemplateConfig({
  RELATIONSHIP_MAPPINGS: { type: 'code-block' },
  FIELDS: { type: 'code-block' },
});

const ObjectionModelGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ObjectionModelDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    objectionFeature: objectionFeatureProvider,
  },
  exports: {
    objectionModel: objectionModelProvider,
  },
  childGenerators: {
    fields: { multiple: true, provider: 'objection-field' },
  },
  createGenerator(descriptor, { objectionFeature }) {
    const className = pascalCase(descriptor.name);
    const modelFileName = paramCase(descriptor.name);
    const modelTableName = snakeCase(descriptor.name);
    const modelPath = `${objectionFeature.getModelFolder()}/${modelFileName}.ts`;
    const fields: TypescriptCodeBlock[] = [];

    const modelFile = new TypescriptSourceFile(MODEL_FILE_CONFIG);

    return {
      getProviders: () => ({
        objectionModel: {
          addField(field: TypescriptCodeBlock) {
            fields.push(field);
          },
        },
      }),
      build: async (context) => {
        modelFile.addCodeBlock(
          'FIELDS',
          TypescriptCodeUtils.mergeBlocks(fields, '\n')
        );

        const modelFileTemplate = await readTemplate(__dirname, 'model.ts');
        context.addAction(
          modelFile.renderToAction(modelFileTemplate, modelPath, {
            MODEL_CLASS_NAME: className,
            MODEL_TABLE_NAME: `'${modelTableName}'`,
          })
        );

        objectionFeature.addModelFile(modelPath);
      },
    };
  },
});

export default ObjectionModelGenerator;
