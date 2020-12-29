import { GeneratorConfig, GeneratorDescriptor } from '@baseplate/sync';

type Descriptor = GeneratorDescriptor;

const descriptorSchema = {};

export interface ReactProvider {
  // react provider
}

interface ProviderMap {
  react: ReactProvider;
}

const ReactGenerator: GeneratorConfig<Descriptor, ProviderMap> = {
  descriptorSchema,
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
};

export default ReactGenerator;
