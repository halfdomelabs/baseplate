import {
  GeneratorDescriptor,
  writeTemplateAction,
  formatterProvider,
  createGeneratorConfig,
  createGeneratorDescriptor,
} from '@baseplate/sync';
import * as yup from 'yup';
import { nodeProvider } from '../node';

interface Descriptor extends GeneratorDescriptor {
  singleQuote: boolean;
}

const descriptorSchema = {
  singleQuote: yup.boolean().default(true),
};

const PrettierGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: { node: nodeProvider },
  exports: {
    formatter: formatterProvider,
  },
  createGenerator(descriptor, { node }) {
    return {
      getProviders: () => {
        return {
          formatter: {
            format: (input: string) => {
              console.log(input);
              return input;
            },
          },
        };
      },
      build: (context) => {
        node.addDevPackage('prettier', '^2.2.1');

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
  },
});

export default PrettierGenerator;
