import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import { camelCase } from 'change-case';
import * as yup from 'yup';
import { FieldType, FIELD_TYPES } from '../../constants/field-types';
import { objectionModelProvider } from '../objection-model';

interface ObjectionFieldDescriptor extends GeneratorDescriptor {
  name: string;
  type: string;
  required: boolean;
  id: boolean;
}

const descriptorSchema = {
  name: yup.string().required(),
  type: yup
    .string()
    .oneOf(FIELD_TYPES.map((t) => t.name))
    .required(),
  required: yup.boolean(),
  id: yup.boolean(),
};

export type ObjectionFieldProvider = {
  getType(): FieldType;
  isRequired(): boolean;
  isIdField(): boolean;
};

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
    const fieldType = FIELD_TYPES.find((t) => t.name === descriptor.type);
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
        objectionField: {
          getType: () => fieldType,
          isRequired: () => descriptor.required,
          isIdField: () => descriptor.id,
        },
      }),
      build: (context) => {},
    };
  },
});

export default ObjectionFieldGenerator;
