import {
  createGeneratorConfig,
  createGeneratorDescriptor,
  GeneratorDescriptor,
} from '@baseplate/sync';

type Descriptor = GeneratorDescriptor;

const descriptorSchema = {};

export type ReactProvider = {};

const ReactGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  createGenerator(descriptor) {
    return {
      getProviders: () => {
        return { react: {} };
      },
      build: (context) => {
        //
      },
    };
  },
});

export default ReactGenerator;
