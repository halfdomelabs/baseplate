import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nexusObjectionTypeProvider } from '../nexus-objection-type';
import { objectionFieldProvider } from '../objection-field';

interface NexusObjectionTypeFieldDescriptor extends GeneratorDescriptor {
  name: string;
}

const descriptorSchema = {
  name: yup.string().required(),
};

export type NexusObjectionTypeFieldProvider = {};

export const nexusObjectionTypeFieldProvider = createProviderType<NexusObjectionTypeFieldProvider>(
  'nexus-objection-type-field'
);

const NexusObjectionTypeFieldGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionTypeFieldDescriptor>(
    descriptorSchema
  ),
  dependsOn: {
    nexusObjectionType: nexusObjectionTypeProvider,
    objectionField: objectionFieldProvider.dependency().reference(),
  },
  exports: {
    nexusObjectionTypeField: nexusObjectionTypeFieldProvider,
  },
  createGenerator(descriptor, { nexusObjectionType, objectionField }) {
    // special-case id fields
    const nonNull = objectionField.isRequired() ? '.nonNull' : '';
    const type = objectionField.isIdField()
      ? 'id'
      : objectionField.getType().nexusType;
    nexusObjectionType.addField({
      code: `t${nonNull}.${type}('${descriptor.name}')`,
    });
    return {
      getProviders: () => ({
        nexusObjectionTypeField: {},
      }),
      build: (context) => {
        //
      },
    };
  },
});

export default NexusObjectionTypeFieldGenerator;
