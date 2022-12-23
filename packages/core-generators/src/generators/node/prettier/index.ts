// because we manually require
/* eslint-disable import/no-import-module-exports */

import path from 'path';
import {
  formatterProvider,
  createGeneratorWithChildren,
  writeJsonAction,
  createProviderType,
} from '@baseplate/sync';
import Piscina from 'piscina';
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
  addPrettierIgnore(path: string): void;
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

const piscina = new Piscina({
  filename: path.resolve(__dirname, 'formatter'),
});

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
    const prettierIgnore: string[] = [
      '/coverage',
      '/dist',
      '/lib',
      '/build',
      '/node_modules',
      '/baseplate',
    ];
    return {
      getProviders: () => {
        let prettierLibPathPromise: Promise<string | null> | undefined;

        return {
          formatter: {
            format: async (input: string, fullPath: string, logger) => {
              if (!PARSEABLE_EXTENSIONS.includes(path.extname(fullPath))) {
                return input;
              }
              if (!prettierLibPathPromise) {
                prettierLibPathPromise = (async () => {
                  const prettierLibPath = await resolveModule(
                    'prettier',
                    fullPath
                  );
                  if (!prettierLibPath) {
                    logger.log(
                      'Could not find prettier library. Falling back to in-built version. Run again once dependencies have been installed.'
                    );
                    return null;
                  }
                  return prettierLibPath;
                })();
              }

              const prettierLibPath = await prettierLibPathPromise;

              // no prettier lib found
              if (!prettierLibPath) {
                return input;
              }

              // run in separate worker thread to avoid issues with caching modules and triggering restarts of process while developing
              return piscina.run({
                prettierLibPath,
                input,
                config: {
                  ...prettierConfig,
                  filepath: fullPath,
                },
              });
            },
          },
          prettier: {
            getConfig: () => prettierConfig,
            addPrettierIgnore(ignorePath) {
              prettierIgnore.push(ignorePath);
            },
          },
        };
      },
      build: async (builder) => {
        node.addDevPackage('prettier', PRETTIER_VERSION);

        node.addScripts({
          'prettier:check': 'prettier --check .',
          'prettier:format': 'prettier -w .',
        });

        await builder.apply(
          writeJsonAction({
            destination: '.prettierrc',
            contents: prettierConfig,
          })
        );

        builder.writeFile('.prettierignore', `${prettierIgnore.join('\n')}\n`);
      },
    };
  },
});

export default PrettierGenerator;
