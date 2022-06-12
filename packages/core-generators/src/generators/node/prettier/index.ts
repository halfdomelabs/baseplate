// because we manually require
/* eslint-disable import/no-import-module-exports */

import path from 'path';
import {
  formatterProvider,
  createGeneratorWithChildren,
  writeJsonAction,
  createProviderType,
} from '@baseplate/sync';
import * as prettier from 'prettier';
import requireResolve from 'resolve';
import { z } from 'zod';
import { nodeProvider } from '../node';

const descriptorSchema = z.object({
  tabWidth: z.number().default(2),
  singleQuote: z.boolean().default(true),
  trailingComma: z.string().default('es5'),
});

interface PrettierConfig {
  tabWidth: number;
  singleQuote: boolean;
  trailingComma: string;
}

export interface PrettierProvider {
  getConfig(): PrettierConfig;
}

export const prettierProvider =
  createProviderType<PrettierProvider>('prettier');

const PARSEABLE_EXTENSIONS = [
  '.json',
  '.js',
  '.ts',
  '.jsx',
  '.tsx',
  '.scss',
  '.css',
  '.html',
  '.sass',
  '.gql',
  '.graphql',
  '.yml',
  '.yaml',
];

const PRETTIER_VERSION = '^2.5.1';

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

const PrettierGenerator = createGeneratorWithChildren({
  descriptorSchema,
  dependencies: { node: nodeProvider },
  exports: {
    formatter: formatterProvider,
    prettier: prettierProvider,
  },
  createGenerator(descriptor, { node }) {
    const prettierConfig = {
      tabWidth: descriptor.tabWidth,
      singleQuote: descriptor.singleQuote,
      trailingComma: descriptor.trailingComma,
    };
    return {
      getProviders: () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let prettierLibPromise: Promise<PrettierModule> | undefined;

        return {
          formatter: {
            format: async (input: string, fullPath: string) => {
              if (!PARSEABLE_EXTENSIONS.includes(path.extname(fullPath))) {
                return input;
              }
              if (!prettierLibPromise) {
                prettierLibPromise = (async () => {
                  const prettierLibPath = await resolveModule(
                    'prettier',
                    fullPath
                  );
                  if (!prettierLibPath) {
                    console.log(
                      'Could not find prettier library. Falling back to in-built version. Run again once dependencies have been installed.'
                    );
                    return prettier;
                  }
                  return module.require(prettierLibPath) as PrettierModule;
                })();
              }

              const prettierLib = await prettierLibPromise;

              // no prettier lib found
              if (!prettierLib) {
                return input;
              }
              return prettierLib.format(input, {
                ...prettierConfig,
                filepath: fullPath,
              });
            },
          },
          prettier: {
            getConfig: () => prettierConfig,
          },
        };
      },
      build: async (builder) => {
        node.addDevPackage('prettier', PRETTIER_VERSION);

        await builder.apply(
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
