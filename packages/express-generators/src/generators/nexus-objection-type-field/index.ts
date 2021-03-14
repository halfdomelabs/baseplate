import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';
import { fieldToDefinition } from '../../utils/nexus-objection';
import { nexusObjectionTypeProvider } from '../nexus-objection-type';
import {
  ObjectionFieldProvider,
  objectionFieldProvider,
} from '../objection-field';

interface NexusObjectionTypeFieldDescriptor extends GeneratorDescriptor {
  name: string;
  field: ObjectionFieldProvider;
}

const descriptorSchema = {
  name: yup.string().required(),
  field: yup.string().required(),
};

export type NexusObjectionTypeFieldProvider = {};

export const nexusObjectionTypeFieldProvider = createProviderType<NexusObjectionTypeFieldProvider>(
  'nexus-objection-type-field'
);

const NexusObjectionTypeFieldGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionTypeFieldDescriptor>(
    descriptorSchema
  ),
  descriptorReferences: {
    field: objectionFieldProvider,
  },
  dependsOn: {
    nexusObjectionType: nexusObjectionTypeProvider,
  },
  exports: {
    nexusObjectionTypeField: nexusObjectionTypeFieldProvider,
  },
  createGenerator(descriptor, { nexusObjectionType }) {
    nexusObjectionType.addField(fieldToDefinition(descriptor.field));
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
