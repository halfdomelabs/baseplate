import {
  Generator,
  GeneratorDescriptor,
  writeFileAction,
} from '@baseplate/sync';
import * as yup from 'yup';

interface Descriptor extends GeneratorDescriptor {
  name: string;
  description: string;
}

const descriptorSchema = {
  name: yup.string().required(),
  description: yup.string(),
};

const NodeGenerator: Generator<Descriptor> = {
  descriptorSchema,
  build: (descriptor, context) => {
    const packageJson = {
      name: descriptor.name,
      description: descriptor.description,
    };
    context.addAction(
      writeFileAction({
        destination: 'package.json',
        contents: JSON.stringify(packageJson),
      })
    );
  },
};

export default NodeGenerator;
