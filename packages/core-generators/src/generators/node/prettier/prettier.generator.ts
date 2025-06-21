import type { FormatFunction, NonOverwriteableMap } from '@baseplate-dev/sync';
import type { Plugin } from 'prettier';

import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
} from '@baseplate-dev/sync';
import { notEmpty } from '@baseplate-dev/utils';
import {
  findNearestPackageJson,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { uniq } from 'es-toolkit';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import prettier from 'prettier';
import prettierPluginPackageJson from 'prettier-plugin-packagejson';
import resolveFrom from 'resolve-from';
import { z } from 'zod';

import { CORE_PACKAGES } from '#src/constants/core-packages.js';
import { packageScope } from '#src/providers/scopes.js';
import { writeJsonToBuilder } from '#src/writers/json.js';

import { nodeProvider } from '../node/index.js';

const descriptorSchema = z.object({
  tabWidth: z.number().default(2),
  singleQuote: z.boolean().default(true),
  trailingComma: z.string().default('all'),
  semi: z.boolean().default(true),
});

export interface PrettierPluginConfig {
  name: string;
  default: Plugin;
  version: string;
}

interface PrettierConfig {
  tabWidth: number;
  singleQuote: boolean;
  trailingComma: string;
  semi: boolean;
}

const DEFAULT_PLUGINS: PrettierPluginConfig[] = [
  {
    name: 'prettier-plugin-packagejson',
    default: prettierPluginPackageJson as Plugin,
    version: CORE_PACKAGES['prettier-plugin-packagejson'],
  },
];

export interface PrettierProvider {
  getConfig(): NonOverwriteableMap<PrettierConfig>;
  addPlugin: (plugin: PrettierPluginConfig) => void;
  addPrettierIgnore(path: string): void;
}

export const prettierProvider =
  createProviderType<PrettierProvider>('prettier');

const PARSEABLE_EXTENSIONS = new Set([
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
  '.cjs',
  '.mjs',
  '.cts',
  '.mts',
  '.md',
]);

const PARSEABLE_FILE_NAMES = new Set(['.prettierrc']);

interface PrettierModule {
  format(input: string, config: Record<string, unknown>): Promise<string>;
}

function resolveModule(name: string, fullPath: string): string | undefined {
  const basedir = path.dirname(fullPath);
  return resolveFrom.silent(basedir, name);
}

async function resolveModuleWithVersion(
  name: string,
  fullPath: string,
): Promise<{ modulePath: string; version: string | undefined } | undefined> {
  const result = resolveModule(name, fullPath);
  if (!result) {
    return undefined;
  }
  const packageJsonPath = await findNearestPackageJson({ cwd: result });
  if (!packageJsonPath) return undefined;
  const packageJson = await readJsonWithSchema(
    packageJsonPath,
    z.object({
      version: z.string().optional(),
    }),
  );
  return {
    modulePath: result,
    version: packageJson.version,
  };
}

export const prettierGenerator = createGenerator({
  name: 'node/prettier',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: { node: nodeProvider },
      exports: {
        prettier: prettierProvider.export(packageScope),
      },
      run({ node }) {
        const prettierConfig = createNonOverwriteableMap<PrettierConfig>({
          tabWidth: descriptor.tabWidth,
          singleQuote: descriptor.singleQuote,
          trailingComma: descriptor.trailingComma,
          semi: descriptor.semi,
        });
        const plugins = [...DEFAULT_PLUGINS];
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
          providers: {
            prettier: {
              getConfig: () => prettierConfig,
              addPrettierIgnore(ignorePath) {
                prettierIgnore.push(ignorePath);
              },
              addPlugin(plugin) {
                plugins.push(plugin);
              },
            },
          },
          build: (builder) => {
            let prettierModulePromise: Promise<PrettierModule> | undefined;
            let prettierConfigPromise:
              | Promise<
                  Omit<PrettierConfig, 'plugins'> & {
                    plugins?: Plugin[];
                  }
                >
              | undefined;
            const formatFunction: FormatFunction = async (
              input: string,
              fullPath: string,
              logger,
            ) => {
              if (
                !PARSEABLE_EXTENSIONS.has(path.extname(fullPath)) &&
                !PARSEABLE_FILE_NAMES.has(path.basename(fullPath))
              ) {
                return input;
              }
              prettierModulePromise ??= (async () => {
                const result = await resolveModuleWithVersion(
                  'prettier',
                  fullPath,
                );
                if (!result) {
                  logger.info(
                    'Could not find prettier library. Falling back to in-built version. Run again once dependencies have been installed.',
                  );
                  // use the in-built version of prettier
                  return prettier;
                }
                if (result.version === prettier.version) {
                  return prettier;
                }
                const rawImport = (await import(
                  // use file:// to support Windows
                  pathToFileURL(result.modulePath).href
                )) as {
                  default: PrettierModule;
                };
                return rawImport.default;
              })();

              const prettierModule = await prettierModulePromise;

              prettierConfigPromise ??= (async () => {
                const resolvedPlugins = await Promise.all(
                  plugins.map(async (plugin) => {
                    const resolvedModule = await resolveModuleWithVersion(
                      plugin.name,
                      fullPath,
                    );

                    if (!resolvedModule) {
                      logger.info(
                        `Could not resolve prettier plugin ${plugin.name}. Run again once dependencies have been installed.`,
                      );
                      return plugin.default;
                    }

                    return plugin.version === resolvedModule.version
                      ? plugin.default
                      : (import(
                          pathToFileURL(resolvedModule.modulePath).href
                        ) as Plugin);
                  }),
                );

                return {
                  ...prettierConfig.value(),
                  plugins:
                    resolvedPlugins.length > 0
                      ? resolvedPlugins.filter(notEmpty)
                      : [],
                };
              })();

              const config = await prettierConfigPromise;

              return prettierModule.format(input, {
                ...config,
                filepath: fullPath,
              });
            };

            builder.addGlobalFormatter({
              name: 'prettier',
              format: formatFunction,
              fileExtensions: [...PARSEABLE_EXTENSIONS],
              fileNames: [...PARSEABLE_FILE_NAMES],
            });

            node.packages.addDevPackages({
              prettier: CORE_PACKAGES.prettier,
              ...Object.fromEntries(
                DEFAULT_PLUGINS.map((plugin) => [plugin.name, plugin.version]),
              ),
            });

            node.scripts.mergeObj({
              'prettier:check': 'prettier --check .',
              'prettier:write': 'prettier -w .',
            });

            writeJsonToBuilder(builder, {
              id: 'prettier-config',
              destination: '.prettierrc',
              contents: {
                ...prettierConfig.value(),
                plugins: plugins.map((plugin) => plugin.name),
              },
            });

            const prettierIgnoreSorted = uniq(prettierIgnore.toSorted());

            builder.writeFile({
              id: 'prettier-ignore',
              destination: '.prettierignore',
              contents: `${prettierIgnoreSorted.join('\n')}\n`,
            });
          },
        };
      },
    }),
  }),
});
