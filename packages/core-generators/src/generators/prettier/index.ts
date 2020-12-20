import {
  Generator,
  GeneratorDescriptor,
  writeTemplateAction,
} from '@baseplate/sync';
import * as yup from 'yup';

interface Descriptor extends GeneratorDescriptor {
  singleQuote: boolean;
}

const descriptorSchema = {
  singleQuote: yup.boolean().default(true),
};

const NodeGenerator: Generator<Descriptor> = {
  descriptorSchema,
  build: (descriptor, context) => {
    context.addAction(
      writeTemplateAction({
        destination: '.prettierrc.js',
        template: '.prettierrc.js.ejs',
        data: {
          singleQuote: descriptor.singleQuote,
        },
      })
    );
  },
};

export default NodeGenerator;
