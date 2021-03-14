import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
  createProviderType,
} from '@baseplate/sync';
import * as yup from 'yup';

interface NexusObjectionCrudDescriptor extends GeneratorDescriptor {
  placeholder: string;
}

const descriptorSchema = {
  placeholder: yup.string(),
};

export type NexusObjectionCrudProvider = {};

export const nexusObjectionCrudProvider = createProviderType<NexusObjectionCrudProvider>(
  'nexus-objection-crud'
);

const NexusObjectionCrudGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<NexusObjectionCrudDescriptor>(
    descriptorSchema
  ),
  dependsOn: {},
  exports: {
    nexusObjectionCrud: nexusObjectionCrudProvider,
  },
  createGenerator(descriptor, dependencies) {
    return {
      getProviders: () => ({
        nexusObjectionCrud: {},
      }),
      build: (context) => {},
    };
  },
});

export default NexusObjectionCrudGenerator;
