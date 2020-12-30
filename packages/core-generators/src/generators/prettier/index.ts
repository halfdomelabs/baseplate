import {
  GeneratorDescriptor,
  formatterProvider,
  createGeneratorConfig,
  createGeneratorDescriptor,
  writeJsonAction,
} from '@baseplate/sync';
import path from 'path';
import * as yup from 'yup';
import requireResolve from 'resolve';
import { nodeProvider } from '../node';

interface Descriptor extends GeneratorDescriptor {
  singleQuote: boolean;
}

const descriptorSchema = {
  singleQuote: yup.boolean().default(true),
};

const PARSEABLE_EXTENSIONS = ['.json', '.js', '.ts', '.jsx', '.tsx'];

function resolveModule(name: string, fullPath: string): Promise<string | null> {
  const basedir = path.dirname(fullPath);
  return new Promise((resolve, reject) => {
    requireResolve(name, { basedir }, (err, resolved): void => {
      if (err) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyError: any = err;
        if (anyError.code === 'MODULE_NOT_FOUND') {
          return resolve(null);
        }
        return reject(err);
      }
      return resolve(resolved || null);
    });
  });
}

const PrettierGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: { node: nodeProvider },
  exports: {
    formatter: formatterProvider,
  },
  createGenerator(descriptor, { node }) {
    const prettierConfig = {
      singleQuote: descriptor.singleQuote,
    };
    return {
      getProviders: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let prettierLib: any;
        return {
          formatter: {
            format: async (input: string, fullPath: string) => {
              if (!PARSEABLE_EXTENSIONS.includes(path.extname(fullPath))) {
                return input;
              }
              // no prettier lib found
              if (prettierLib === false) {
                return input;
              }
              if (!prettierLib) {
                const prettierLibPath = await resolveModule(
                  'prettier',
                  fullPath
                );
                if (!prettierLibPath) {
                  console.log(
                    'Could not find prettier library. Run again once dependencies have been installed.'
                  );
                  return input;
                }
                prettierLib = module.require(prettierLibPath);
              }
              return prettierLib.format(input, {
                ...prettierConfig,
                filepath: fullPath,
              });
            },
          },
        };
      },
      build: (context) => {
        node.addDevPackage('prettier', '^2.2.1');

        context.addAction(
          writeJsonAction({
            destination: '.prettierrc',
            contents: prettierConfig,
          })
        );
      },
    };
  },
});

export default PrettierGenerator;
