import {
  createTypescriptTemplateConfig,
  TypescriptCodeBlock,
  TypescriptCodeUtils,
  TypescriptSourceBlock,
} from '@baseplate/core-generators';
import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
  readTemplate,
} from '@baseplate/sync';
import { camelCase, pascalCase } from 'change-case';
import { pluralize } from 'inflected';
import * as yup from 'yup';
import R from 'ramda';
import { fieldToDefinition } from '../../utils/nexus-objection';
import {
  nexusObjectionTypeProvider,
  NexusObjectionTypeProvider,
} from '../nexus-objection-type';
import { nexusSchemaProvider } from '../nexus-schema';
import {
  objectionFieldProvider,
  ObjectionFieldProvider,
} from '../objection-field';
import {
  ObjectionModelProvider,
  objectionModelProvider,
} from '../objection-model';

interface NexusObjectionCrudDescriptor extends GeneratorDescriptor {
  name: string;
  objectType: NexusObjectionTypeProvider;
  model: ObjectionModelProvider;
  idField: ObjectionFieldProvider;
  insertFields: ObjectionFieldProvider[];
  updateFields: ObjectionFieldProvider[];
}

const descriptorSchema = {
  name: yup.string().required(),
  model: yup.string().required(),
  objectType: yup.string().required(),
  idField: yup.string().required(),
  insertFields: yup.array(yup.string()),
  updateFields: yup.array(yup.string()),
};

const crudFileConfig = createTypescriptTemplateConfig({
  MODEL_CLASS: { type: 'code-expression' },
  INSERT_FIELDS: { type: 'code-block' },
  INSERT_VALUES: { type: 'code-expression' },
  UPDATE_FIELDS: { type: 'code-block' },
  UPDATE_VALUES: { type: 'code-expression' },
  DELETE_FIELDS: { type: 'code-block' },
});

export type NexusObjectionCrudProvider = {
  getCrudFile(): TypescriptSourceBlock<typeof crudFileConfig>;
};

export const nexusObjectionCrudProvider = createProviderType<NexusObjectionCrudProvider>(
  'nexus-objection-crud'
);

function toInputDefinition(
  fields: ObjectionFieldProvider[]
): TypescriptCodeBlock {
  return TypescriptCodeUtils.mergeBlocks(
    fields.map((field) => fieldToDefinition(field))
  );
}

const NexusObjectionCrudGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionCrudDescriptor>(
    descriptorSchema
  ),
  descriptorReferences: {
    objectType: nexusObjectionTypeProvider,
    model: objectionModelProvider,
    idField: objectionFieldProvider,
    'insertFields.*': objectionFieldProvider,
    'updateFields.*': objectionFieldProvider,
  },
  dependsOn: {
    nexusSchema: nexusSchemaProvider,
  },
  exports: {
    nexusObjectionCrud: nexusObjectionCrudProvider,
  },
  createGenerator(
    { objectType, model, idField, insertFields, updateFields },
    { nexusSchema }
  ) {
    const crudFile = new TypescriptSourceBlock(crudFileConfig);
    const camelCaseName = camelCase(model.getName());
    const pascalCaseName = pascalCase(model.getName());

    crudFile.addCodeExpression('MODEL_CLASS', model.getClassExpression());

    crudFile.addCodeBlock('INSERT_FIELDS', toInputDefinition(insertFields));
    crudFile.addCodeBlock(
      'UPDATE_FIELDS',
      toInputDefinition([idField, ...updateFields])
    );
    crudFile.addCodeBlock('DELETE_FIELDS', toInputDefinition([idField]));

    crudFile.addCodeExpression(
      'INSERT_VALUES',
      TypescriptCodeUtils.mergeExpressionsAsObject(
        R.fromPairs(
          insertFields.map((field) => [
            field.getName(),
            { expression: `input.${field.getName()}` },
          ])
        )
      )
    );

    crudFile.addCodeExpression(
      'UPDATE_VALUES',
      TypescriptCodeUtils.mergeExpressionsAsObject(
        R.fromPairs(
          updateFields.map((field) => [
            field.getName(),
            { expression: `input.${field.getName()}` },
          ])
        )
      )
    );

    return {
      getProviders: () => ({
        nexusObjectionCrud: {
          getCrudFile: () => crudFile,
        },
      }),
      build: async () => {
        const template = await readTemplate(__dirname, 'crud.ts');
        const code = crudFile.render(template, {
          LIST_QUERY_VAR: `${pluralize(camelCaseName)}Query`,
          LIST_QUERY_NAME: `'${pluralize(camelCaseName)}'`,
          QUERY_BY_ID_VAR: `${camelCaseName}ById`,
          QUERY_BY_ID_NAME: `'${camelCaseName}ById'`,
          INSERT_MUTATION_VAR: `insert${pascalCaseName}`,
          INSERT_MUTATION_NAME: `'insert${pascalCaseName}'`,
          UPDATE_MUTATION_VAR: `update${pascalCaseName}`,
          UPDATE_MUTATION_NAME: `'update${pascalCaseName}'`,
          DELETE_MUTATION_VAR: `delete${pascalCaseName}`,
          DELETE_MUTATION_NAME: `'delete${pascalCaseName}'`,
          OBJECT_TYPE: `'${objectType.getTypeName()}'`,
          ID_FIELD_NAME: idField.getName(),
          MODEL_FIELD_NAME: `'${camelCaseName}'`,
        });
        nexusSchema.getSchemaFile().addCodeBlock('FIELDS', code);
      },
    };
  },
});

export default NexusObjectionCrudGenerator;
