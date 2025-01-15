import type { FormatFunction, NonOverwriteableMap } from '@halfdomelabs/sync';
import type { Plugin } from 'prettier';

import {
  createGenerator,
  createNonOverwriteableMap,
  createProviderType,
  writeJsonAction,
} from '@halfdomelabs/sync';
import { uniq } from 'es-toolkit';
import fs from 'fs-extra';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { packageUp } from 'package-up';
import prettier from 'prettier';
import prettierPluginPackageJson from 'prettier-plugin-packagejson';
import resolveFrom from 'resolve-from';
import { z } from 'zod';

import { projectScope } from '@src/providers/scopes.js';
import { notEmpty } from '@src/utils/array.js';

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
    version: '2.5.2',
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
]);

const PRETTIER_VERSION = '3.3.3';

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
  const packageJsonPath = await packageUp({ cwd: result });
  if (!packageJsonPath) return undefined;
  const packageJson = (await fs.readJson(packageJsonPath)) as {
    version?: string;
  };
  return {
    modulePath: result,
    version: packageJson.version,
  };
}

export const prettierGenerator = createGenerator({
  name: 'node/prettier',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks(taskBuilder, descriptor) {
    taskBuilder.addTask({
      name: 'main',
      dependencies: { node: nodeProvider },
      exports: {
        prettier: prettierProvider.export(projectScope),
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
          build: async (builder) => {
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
              if (!PARSEABLE_EXTENSIONS.has(path.extname(fullPath))) {
                return input;
              }
              if (!prettierModulePromise) {
                prettierModulePromise = (async () => {
                  const result = await resolveModuleWithVersion(
                    'prettier',
                    fullPath,
                  );
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
                  const rawImport = (await import(
                    // use file:// to support Windows
                    pathToFileURL(result.modulePath).href
                  )) as {
                    default: PrettierModule;
                  };
                  return rawImport.default;
                })();
              }

              const prettierModule = await prettierModulePromise;

              if (!prettierConfigPromise) {
                prettierConfigPromise = (async () => {
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
              }

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
            });

            node.addDevPackages({
              prettier: PRETTIER_VERSION,
              ...Object.fromEntries(
                DEFAULT_PLUGINS.map((plugin) => [plugin.name, plugin.version]),
              ),
            });

            node.addScripts({
              'prettier:check': 'prettier --check .',
              'prettier:write': 'prettier -w .',
            });

            await builder.apply(
              writeJsonAction({
                destination: '.prettierrc',
                contents: {
                  ...prettierConfig.value(),
                  plugins: plugins.map((plugin) => plugin.name),
                },
              }),
            );

            const prettierIgnoreSorted = uniq(prettierIgnore.toSorted());

            builder.writeFile(
              '.prettierignore',
              `${prettierIgnoreSorted.join('\n')}\n`,
            );
          },
        };
      },
    });
  },
});
