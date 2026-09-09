import type { FormatFunction, NonOverwriteableMap } from '@baseplate-dev/sync';
import type { Plugin } from 'prettier';

import {
  createGenerator,
  createGeneratorTask,
  createNonOverwriteableMap,
  createProviderType,
  POST_WRITE_COMMAND_PRIORITY,
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
  disableDefaultScripts: z.boolean().default(false),
  additionalIgnorePaths: z.array(z.string()).optional(),
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

/**
 * A generated file a prettier plugin reads from disk while formatting.
 */
export interface PrettierMaterializedFormatterInput {
  /**
   * Output-relative path of the file.
   */
  path: string;
  /**
   * Builds the prettier options that point the plugin at the mirrored copy.
   *
   * Omitted for a file that is only reached through another input's relative
   * import, which needs mirroring but is named by no option.
   */
  buildOptions?: (materializedPath: string) => Record<string, unknown>;
}

export interface PrettierProvider {
  getConfig(): NonOverwriteableMap<PrettierConfig>;
  addPlugin: (plugin: PrettierPluginConfig) => void;
  addExtraOptions: (options: Record<string, unknown>) => void;
  addPrettierIgnore(path: string): void;
  /**
   * Declares a generated file a plugin reads from disk, so the sync engine
   * mirrors it and formatting sees this sync's version rather than the working
   * tree's.
   *
   * @param input The file and how to point the plugin at its mirrored copy.
   */
  addMaterializedFormatterInput(
    input: PrettierMaterializedFormatterInput,
  ): void;
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

function resolveModule(name: string, basedir: string): string | undefined {
  return resolveFrom.silent(basedir, name);
}

async function resolveModuleWithVersion(
  name: string,
  basedir: string,
): Promise<{ modulePath: string; version: string | undefined } | undefined> {
  const result = resolveModule(name, basedir);
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
        const materializedFormatterInputs: PrettierMaterializedFormatterInput[] =
          [];
        const prettierIgnore: string[] = [
          '/coverage',
          '/dist',
          '/lib',
          '/build',
          '/node_modules',
          '/baseplate',
          'pnpm-lock.yaml',
        ];
        if (descriptor.additionalIgnorePaths) {
          prettierIgnore.push(...descriptor.additionalIgnorePaths);
        }
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
              addExtraOptions(options) {
                prettierConfig.merge(options);
              },
              addMaterializedFormatterInput(input) {
                materializedFormatterInputs.push(input);
              },
            },
          },
          build: (builder) => {
            let prettierModulePromise: Promise<PrettierModule> | undefined;
            let hasLoggedFormatError = false;
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
              formatOptions,
            ) => {
              if (
                !PARSEABLE_EXTENSIONS.has(path.extname(fullPath)) &&
                !PARSEABLE_FILE_NAMES.has(path.basename(fullPath))
              ) {
                return input;
              }
              const resolveBaseDir = formatOptions.outputDirectory;

              prettierModulePromise ??= (async () => {
                const result = await resolveModuleWithVersion(
                  'prettier',
                  resolveBaseDir,
                );
                if (!result) {
                  logger.info(
                    'Could not find prettier library. Falling back to in-built version. Files will be re-formatted after dependencies are installed.',
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
                      resolveBaseDir,
                    );

                    if (!resolvedModule) {
                      logger.info(
                        `Could not resolve prettier plugin ${plugin.name}. Files will be re-formatted after dependencies are installed.`,
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

              const baseConfig = await prettierConfigPromise;
              // Applied per call rather than folded into the memoized config,
              // which is shared across operations with different mirror paths.
              const materializedOverrides: Record<string, unknown> = {};
              for (const materializedFormatterInput of materializedFormatterInputs) {
                const materializedPath =
                  formatOptions.materializedFormatterInputs?.get(
                    materializedFormatterInput.path,
                  );
                if (
                  materializedPath &&
                  materializedFormatterInput.buildOptions
                ) {
                  Object.assign(
                    materializedOverrides,
                    materializedFormatterInput.buildOptions(materializedPath),
                  );
                }
              }
              const config = { ...baseConfig, ...materializedOverrides };

              try {
                return await prettierModule.format(input, {
                  ...config,
                  filepath: fullPath,
                });
              } catch (err) {
                if (!hasLoggedFormatError) {
                  hasLoggedFormatError = true;
                  logger.info(
                    `Prettier formatting failed: ${err instanceof Error ? err.message : String(err)}. Falling back to base config without plugins. Files will be re-formatted after dependencies are installed.`,
                  );
                }
                return prettierModule.format(input, {
                  tabWidth: descriptor.tabWidth,
                  singleQuote: descriptor.singleQuote,
                  trailingComma: descriptor.trailingComma,
                  semi: descriptor.semi,
                  filepath: fullPath,
                });
              }
            };

            builder.addGlobalFormatter({
              name: 'prettier',
              format: formatFunction,
              fileExtensions: [...PARSEABLE_EXTENSIONS],
              fileNames: [...PARSEABLE_FILE_NAMES],
              materializedFormatterInputs: materializedFormatterInputs.map(
                (input) => input.path,
              ),
            });

            // `package.json` mirrors the `pnpm install` trigger at
            // DEPENDENCIES, so a sync that reinstalls dependencies re-formats
            // with the prettier and plugin versions it just installed rather
            // than the ones the in-memory pass used.
            builder.addPostWriteCommand('prettier --write .', {
              priority: POST_WRITE_COMMAND_PRIORITY.FORMATTING,
              onlyIfChanged: [
                '.prettierrc',
                'package.json',
                ...materializedFormatterInputs.map((input) => input.path),
              ],
            });

            node.packages.addDevPackages({
              prettier: CORE_PACKAGES.prettier,
              ...Object.fromEntries(
                DEFAULT_PLUGINS.map((plugin) => [plugin.name, plugin.version]),
              ),
            });

            if (!descriptor.disableDefaultScripts) {
              node.scripts.mergeObj({
                'prettier:check': 'prettier --check .',
                'prettier:write': 'prettier -w -l .',
              });
            }

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
