import { nodeProvider } from '@baseplate/core-generators';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';

const descriptorSchema = yup.object({
  placeholder: yup.string(),
});

const ReactTwinGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies:  {
node: nodeProvider},
  createGenerator(descriptor, {node}) {
    node.addPackages({
      
    })
    return {
      build: async (builder) => {},
    };
  },
});

export default ReactTwinGenerator;
