import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import { camelCase } from 'change-case';
import * as yup from 'yup';
import { objectionModelProvider } from '../objection-model';

interface ObjectionFieldDescriptor extends GeneratorDescriptor {
  name: string;
  type: string;
  required: boolean;
}

interface ObjectionFieldType {
  name: string;
  jsType: string;
}

const OBJECTION_TYPES: ObjectionFieldType[] = [
  { name: 'boolean', jsType: 'boolean' },
  { name: 'increments', jsType: 'number' },
  { name: 'integer', jsType: 'number' },
  { name: 'dateTime', jsType: 'string' },
  { name: 'string', jsType: 'string' },
];

const descriptorSchema = {
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf(OBJECTION_TYPES.map((t) => t.name))
    .required(),
  required: yup.boolean(),
};

export type ObjectionFieldProvider = {};

export const objectionFieldProvider = createProviderType<ObjectionFieldProvider>(
  'objection-field'
);

const ObjectionFieldGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<ObjectionFieldDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    objectionModel: objectionModelProvider,
  },
  exports: {
    objectionField: objectionFieldProvider,
  },
  createGenerator(descriptor, { objectionModel }) {
    const fieldName = camelCase(descriptor.name);
    const fieldType = OBJECTION_TYPES.find((t) => t.name === descriptor.type);
    if (!fieldType) {
      throw new Error(`Could not find type ${descriptor.type}`);
    }
    objectionModel.addField({
      code: `${fieldName}${descriptor.required ? '!' : ''}: ${
        fieldType.jsType
      }`,
    });
    return {
      getProviders: () => ({
        objectionField: {},
      }),
      build: (context) => {},
    };
  },
});

export default ObjectionFieldGenerator;
