// because we manually require
/* eslint-disable import/no-import-module-exports */

import { createRequire } from 'module';
import path from 'path';
import {
  formatterProvider,
  createGeneratorWithChildren,
  writeJsonAction,
  createProviderType,
} from '@halfdomelabs/sync';
import _ from 'lodash';
import prettier from 'prettier';
import requireResolve from 'resolve';
import { z } from 'zod';
import { nodeProvider } from '../node/index.js';

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

const PRETTIER_VERSION = '2.8.4';

interface PrettierModule {
  format(input: string, config: Record<string, unknown>): string;
}

interface ResolveError extends Error {
  code?: string;
}

const require = createRequire(import.meta.url);

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
        let prettierModulePromise: Promise<PrettierModule> | undefined;

        return {
          formatter: {
            format: async (input: string, fullPath: string, logger) => {
              if (!PARSEABLE_EXTENSIONS.includes(path.extname(fullPath))) {
                return input;
              }
              if (!prettierModulePromise) {
                prettierModulePromise = (async () => {
                  const prettierLibPath = await resolveModule(
                    'prettier',
                    fullPath
                  );
                  if (!prettierLibPath) {
                    logger.log(
                      'Could not find prettier library. Falling back to in-built version. Run again once dependencies have been installed.'
                    );
                    return prettier;
                  }
                  // eslint-disable-next-line import/no-dynamic-require
                  return require(prettierLibPath) as PrettierModule;
                })();
              }

              const prettierModule = await prettierModulePromise;

              return prettierModule.format(input, {
                ...prettierConfig,
                filepath: fullPath,
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

        const prettierIgnoreSorted = _.uniq(_.sortBy(prettierIgnore));

        builder.writeFile(
          '.prettierignore',
          `${prettierIgnoreSorted.join('\n')}\n`
        );
      },
    };
  },
});

export default PrettierGenerator;
