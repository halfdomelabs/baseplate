// because we manually require
/* eslint-disable import/no-import-module-exports */

import {
  formatterProvider,
  createGeneratorWithChildren,
  writeJsonAction,
  createProviderType,
} from '@halfdomelabs/sync';
import _ from 'lodash';
import { createRequire } from 'module';
import path from 'path';
import prettier from 'prettier';
import requireResolve from 'resolve';
import { z } from 'zod';

import { nodeProvider } from '../node/index.js';

const descriptorSchema = z.object({
  tabWidth: z.number().default(2),
  singleQuote: z.boolean().default(true),
  trailingComma: z.string().default('all'),
  semi: z.boolean().default(true),
  plugins: z.array(z.string()).default([]),
});

interface PrettierConfig {
  tabWidth: number;
  singleQuote: boolean;
  trailingComma: string;
  semi: boolean;
  plugins: string[];
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

const PRETTIER_VERSION = '3.1.0';

interface PrettierModule {
  format(input: string, config: Record<string, unknown>): Promise<string>;
}

interface ResolveError extends Error {
  code?: string;
}

const require = createRequire(import.meta.url);

function resolveModule(
  name: string,
  fullPath: string,
): Promise<{ modulePath: string; version: string | undefined } | undefined> {
  const basedir = path.dirname(fullPath);
  return new Promise((resolve, reject) => {
    requireResolve(name, { basedir }, (err, resolved, meta): void => {
      if (err ?? !resolved) {
        const resolveError: ResolveError = err as ResolveError;
        if (resolveError.code === 'MODULE_NOT_FOUND' || !resolved) {
          return resolve(undefined);
        }
        return reject(err);
      }
      return resolve({
        modulePath: resolved,
        version: meta?.version,
      });
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
      semi: descriptor.semi,
      plugins: descriptor.plugins,
    };
    const prettierIgnore: string[] = [
      '/coverage',
      '/dist',
      '/lib',
      '/build',
      '/node_modules',
      '/baseplate',
      'pnpm-lock.yaml',
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
                  const result = await resolveModule('prettier', fullPath);
                  if (!result) {
                    logger.info(
                      'Could not find prettier library. Falling back to in-built version. Run again once dependencies have been installed.',
                    );
                    // use cached version of prettier if available
                    return prettier;
                  }
                  if (result.version === prettier.version) {
                    return prettier;
                  }
                  // eslint-disable-next-line import/no-dynamic-require
                  return require(result.modulePath) as PrettierModule;
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
        node.addDevPackages({
          prettier: PRETTIER_VERSION,
          'prettier-plugin-packagejson': '2.4.10',
        });

        node.addScripts({
          'prettier:check': 'prettier --check .',
          'prettier:write': 'prettier -w .',
        });

        await builder.apply(
          writeJsonAction({
            destination: '.prettierrc',
            contents: prettierConfig,
          }),
        );

        const prettierIgnoreSorted = _.uniq(_.sortBy(prettierIgnore));

        builder.writeFile(
          '.prettierignore',
          `${prettierIgnoreSorted.join('\n')}\n`,
        );
      },
    };
  },
});

export default PrettierGenerator;
