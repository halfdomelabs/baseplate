import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';

interface NexusObjectionTypeDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type NexusObjectionTypeProvider = {};

export const nexusObjectionTypeProvider = createProviderType<NexusObjectionTypeProvider>(
  'nexus-objection-type'
);

const NexusObjectionTypeGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionTypeDescriptor>(
    descriptorSchema
  ),
  dependsOn: {},
  exports: {
    nexusObjectionType: nexusObjectionTypeProvider,
  },
  createGenerator(descriptor, dependencies) {
    return {
      getProviders: () => ({
        nexusObjectionType: {},
      }),
      build: (context) => {},
    };
  },
});

export default NexusObjectionTypeGenerator;
