import {
  GeneratorConfig,
  GeneratorDescriptor,
  writeTemplateAction,
  FormatterProvider,
} from '@baseplate/sync';
import * as yup from 'yup';
import { NodeProviderType } from '../node';

interface Descriptor extends GeneratorDescriptor {
  singleQuote: boolean;
}

const descriptorSchema = {
  singleQuote: yup.boolean().default(true),
};

type ProviderMap = {
  formatter: FormatterProvider;
};

const PrettierGenerator: GeneratorConfig<Descriptor, ProviderMap> = {
  descriptorSchema,
  requires: [NodeProviderType.name],
  provides: ['formatter'],
  createGenerator(descriptor) {
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
        const node = context.getProvider(NodeProviderType);
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
};

export default PrettierGenerator;
