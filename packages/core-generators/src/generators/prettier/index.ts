import {
  GeneratorDescriptor,
  formatterProvider,
  createGeneratorConfig,
  createGeneratorDescriptor,
  writeJsonAction,
  createProviderType,
} from '@baseplate/sync';
import path from 'path';
import * as yup from 'yup';
import requireResolve from 'resolve';
import { nodeProvider } from '../node';

interface Descriptor extends GeneratorDescriptor {
  tabWidth: number;
  singleQuote: boolean;
}

const descriptorSchema = {
  tabWidth: yup.number().default(2),
  singleQuote: yup.boolean().default(true),
};

interface PrettierConfig {
  tabWidth: number;
  singleQuote: boolean;
}

export interface PrettierProvider {
  getConfig(): PrettierConfig;
}

export const prettierProvider = createProviderType<PrettierProvider>(
  'prettier'
);

const PARSEABLE_EXTENSIONS = ['.json', '.js', '.ts', '.jsx', '.tsx'];

interface ResolveError extends Error {
  code?: string;
}

function resolveModule(name: string, fullPath: string): Promise<string | null> {
  const basedir = path.dirname(fullPath);
  return new Promise((resolve, reject) => {
    requireResolve(name, { basedir }, (err, resolved): void => {
      if (err) {
        const resolveError: ResolveError = err as ResolveError;
        if (resolveError.code === 'MODULE_NOT_FOUND') {
          return resolve(null);
        }
        return reject(err);
      }
      return resolve(resolved || null);
    });
  });
}

interface PrettierModule {
  format(input: string, config: Record<string, unknown>): string;
}

const PrettierGenerator = createGeneratorConfig({
  descriptorSchema: createGeneratorDescriptor<Descriptor>(descriptorSchema),
  dependsOn: { node: nodeProvider },
  exports: {
    formatter: formatterProvider,
    prettier: prettierProvider,
  },
  createGenerator(descriptor, { node }) {
    const prettierConfig = {
      singleQuote: descriptor.singleQuote,
    };
    return {
      getProviders: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let prettierLib: PrettierModule;
        let prettierLibNotFound = false;
        return {
          formatter: {
            format: async (input: string, fullPath: string) => {
              if (!PARSEABLE_EXTENSIONS.includes(path.extname(fullPath))) {
                return input;
              }
              // no prettier lib found
              if (prettierLibNotFound) {
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
                  prettierLibNotFound = true;
                  return input;
                }
                prettierLib = module.require(prettierLibPath) as PrettierModule;
              }
              return prettierLib.format(input, {
                ...prettierConfig,
                filepath: fullPath,
              });
            },
          },
          prettier: {
            getConfig: () => ({
              tabWidth: descriptor.tabWidth,
              singleQuote: descriptor.singleQuote,
            }),
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
