import {
  handleFileNotFoundError,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { z } from 'zod';

import type {
  PluginMetadata,
  PluginMetadataWithPaths,
} from '../plugins/index.js';

import { pluginMetadataSchema } from '../plugins/index.js';

/**
 * Schema for baseplate configuration in package.json
 */
const baseplatePackageConfigSchema = z
  .object({
    baseplate: z
      .object({
        /**
         * Glob patterns to search for plugin.json files.
         * Defaults to built plugins only if not specified.
         */
        pluginGlobs: z.array(z.string()).optional(),
        /**
         * Web build directory relative to package root.
         * Defaults to dist/web if not specified.
         */
        webBuildDirectory: z.string().optional(),
      })
      .optional(),
  })
  .optional();

type BaseplatePackageConfig = z.infer<typeof baseplatePackageConfigSchema>;

export class PluginLoaderError extends Error {
  public innerError?: unknown;

  constructor(message: string, innerError?: unknown) {
    super(
      `Error loading plugin (${message}): ${innerError instanceof Error ? innerError.message : String(innerError)}`,
    );
    this.innerError = innerError;
    this.name = 'PluginLoaderError';
  }
}

async function fileExists(path: string): Promise<boolean> {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
}

/**
 * Read baseplate configuration from package.json
 */
async function readBaseplatePackageConfig(
  pluginPackageDirectory: string,
): Promise<BaseplatePackageConfig | undefined> {
  const packageJsonPath = path.join(pluginPackageDirectory, 'package.json');

  try {
    const packageConfig = await readJsonWithSchema(
      packageJsonPath,
      baseplatePackageConfigSchema,
    ).catch(handleFileNotFoundError);

    return packageConfig;
  } catch {
    // If package.json doesn't exist or is invalid, return undefined (use defaults)
    return undefined;
  }
}

async function readPluginMetadata(directory: string): Promise<PluginMetadata> {
  const pluginJsonFilename = path.join(directory, 'plugin.json');
  try {
    const pluginJsonContent = await readJsonWithSchema(
      pluginJsonFilename,
      pluginMetadataSchema,
    ).catch(handleFileNotFoundError);

    if (!pluginJsonContent) {
      throw new Error(
        `Plugin configuration file not found: ${pluginJsonFilename}`,
      );
    }

    return pluginJsonContent;
  } catch (error) {
    throw new PluginLoaderError(
      `Unable to read plugin configuration ${pluginJsonFilename}`,
      error,
    );
  }
}

const ENTRYPOINT_TYPES = ['node', 'web', 'common'] as const;
type EntrypointType = (typeof ENTRYPOINT_TYPES)[number];

const NODE_ENTRYPOINT_TYPES = new Set(['node', 'common']);
const WEB_ENTRYPOINT_TYPES = new Set(['web', 'common']);

interface EntrypointInfo {
  type: EntrypointType;
  path: string;
}

/**
 * Look for a file that exists with a JS extension (.js(x), .ts(x))
 */
async function findJavascriptFile(
  pathWithoutExtension: string,
): Promise<string | undefined> {
  const candidatePaths = ['ts', 'js', 'tsx', 'jsx'].map(
    (extension) => `${pathWithoutExtension}.${extension}`,
  );

  for (const path of candidatePaths) {
    if (await fileExists(path)) {
      return path;
    }
  }

  return undefined;
}

async function getPluginEntrypoints(
  metadata: PluginMetadata,
  pluginDirectory: string,
): Promise<EntrypointInfo[]> {
  try {
    const { moduleDirectories = ['.'] } = metadata;

    // find all module directories
    const moduleDirectoryPaths = moduleDirectories.map((moduleDirectory) =>
      path.join(pluginDirectory, moduleDirectory),
    );

    const moduleEntrypoints = await Promise.all(
      moduleDirectoryPaths.map(
        async (moduleDirectoryPath) =>
          await Promise.all(
            ENTRYPOINT_TYPES.map(async (entrypoint) => {
              const entrypointPath = await findJavascriptFile(
                path.join(moduleDirectoryPath, entrypoint),
              );
              if (!entrypointPath) {
                return;
              }
              return { type: entrypoint, path: entrypointPath };
            }),
          ),
      ),
    );

    return moduleEntrypoints.flat().filter((x) => x !== undefined);
  } catch (error) {
    throw new PluginLoaderError(
      `Unable to find plugin entrypoints in ${pluginDirectory}`,
      error,
    );
  }
}

function getWebEntrypointImport(
  pluginName: string,
  pluginDirectory: string,
  entrypointPath: string,
): string {
  const pathWithoutExtension = entrypointPath.replace(/\.[jt]sx?$/, '');
  const relativeEntrypoint = path
    .relative(pluginDirectory, pathWithoutExtension)
    .replace(/\\/g, '/');
  return `${pluginName}/${relativeEntrypoint}`;
}

async function populatePluginMetadataWithPaths(
  metadata: PluginMetadata,
  packageName: string,
  pluginDirectory: string,
  webBuildDirectory: string,
): Promise<PluginMetadataWithPaths> {
  try {
    const entrypoints = await getPluginEntrypoints(metadata, pluginDirectory);
    const nodeEntrypoints = entrypoints.filter((n) =>
      NODE_ENTRYPOINT_TYPES.has(n.type),
    );
    const webEntrypoints = entrypoints.filter((n) =>
      WEB_ENTRYPOINT_TYPES.has(n.type),
    );
    return {
      ...metadata,
      // URL safe key
      key: `${packageName
        .replace(/^@/, '')
        .replace(/[^a-z0-9/]+/g, '-')
        .replace(/\//g, '_')}_${metadata.name.replace(/[^a-z0-9]+/g, '-')}`,
      packageName,
      fullyQualifiedName: `${packageName}:${metadata.name}`,
      pluginDirectory,
      webBuildDirectory,
      nodeModulePaths: nodeEntrypoints.map((e) => e.path),
      webModulePaths: webEntrypoints.map((e) =>
        getWebEntrypointImport(metadata.name, pluginDirectory, e.path),
      ),
    };
  } catch (error) {
    throw new PluginLoaderError(
      'Unable to populate plugin metadata with paths',
      error,
    );
  }
}

/**
 * Discover plugin directories by scanning for plugin.json files
 */
async function discoverPluginDirectories(
  pluginPackageDirectory: string,
  pluginGlobs: string[] = ['dist/*/plugin.json'],
): Promise<string[]> {
  const pluginJsonFiles = await globby(pluginGlobs, {
    cwd: pluginPackageDirectory,
    expandDirectories: false,
    fs: fsAdapter,
  });

  return pluginJsonFiles.map((pluginJsonFile) =>
    path.join(pluginPackageDirectory, path.dirname(pluginJsonFile)),
  );
}

/**
 * Gets the web build directory for a plugin package, using package.json config or defaults
 */
async function getWebBuildDirectory(
  pluginPackageDirectory: string,
): Promise<string> {
  const packageConfig = await readBaseplatePackageConfig(
    pluginPackageDirectory,
  );
  const webBuildDirectory =
    packageConfig?.baseplate?.webBuildDirectory ?? 'dist/web';
  return path.join(pluginPackageDirectory, webBuildDirectory);
}

export interface LoadPluginsInPackageOptions {
  /**
   * Glob patterns to search for plugin.json files.
   * Defaults to built plugins only.
   * For development, can include both src and dist directories.
   */
  pluginGlobs?: string[];
}

/**
 * Finds the available plugins in a package.
 */
export async function loadPluginsInPackage(
  pluginPackageDirectory: string,
  packageName: string,
  options: LoadPluginsInPackageOptions = {},
): Promise<PluginMetadataWithPaths[]> {
  // Read package.json configuration for defaults
  const packageConfig = await readBaseplatePackageConfig(
    pluginPackageDirectory,
  );
  const defaultPluginGlobs = packageConfig?.baseplate?.pluginGlobs ?? [
    'dist/*/plugin.json',
  ];

  const { pluginGlobs = defaultPluginGlobs } = options;

  // Discover plugin directories using configurable globs
  const pluginDirectories = await discoverPluginDirectories(
    pluginPackageDirectory,
    pluginGlobs,
  );

  if (pluginDirectories.length === 0) {
    throw new PluginLoaderError(
      `No plugins found in package ${packageName}. Searched with globs: ${pluginGlobs.join(', ')}`,
      undefined,
    );
  }

  // Use configured or conventional web build directory
  const webBuildDirectory = await getWebBuildDirectory(pluginPackageDirectory);

  // Load the plugins
  const plugins = await Promise.all(
    pluginDirectories.map(async (directory) => {
      const metadata = await readPluginMetadata(directory);
      return populatePluginMetadataWithPaths(
        metadata,
        packageName,
        directory,
        webBuildDirectory,
      );
    }),
  );
  return plugins;
}

async function getModuleFederationTargetsForPlugin(
  metadata: PluginMetadata,
  pluginDirectory: string,
  pluginPackageDirectory: string,
): Promise<Record<string, string>> {
  const entrypoints = await getPluginEntrypoints(metadata, pluginDirectory);

  const pluginTargets = entrypoints
    .filter((e) => WEB_ENTRYPOINT_TYPES.has(e.type))
    .map((entrypoint) => {
      const entrypointImport = getWebEntrypointImport(
        metadata.name,
        pluginDirectory,
        entrypoint.path,
      );
      const relativePath = path.relative(
        pluginPackageDirectory,
        entrypoint.path,
      );
      return {
        [entrypointImport]: relativePath,
      };
    });

  return Object.assign({}, ...pluginTargets.flat()) as Record<string, string>;
}

export function rewriteDistToSrc(directory: string): string {
  return directory.replace(/^dist\//, 'src/');
}

interface GetModuleFederationTargetsOptions {
  /**
   * Rewrites the plugin directory to a different path. Useful when
   * the source plugin directory is different than the compiled code.
   */
  rewritePluginDirectory?: (directory: string) => string;
}

export async function getModuleFederationTargets(
  pluginPackageDirectory: string,
  options: GetModuleFederationTargetsOptions = {},
): Promise<Record<string, string>> {
  const { rewritePluginDirectory } = options;

  // Read package.json configuration for plugin globs
  const packageConfig = await readBaseplatePackageConfig(
    pluginPackageDirectory,
  );
  const pluginGlobs = packageConfig?.baseplate?.pluginGlobs ?? [
    'dist/*/plugin.json',
  ];

  // Discover plugin directories using configured globs
  const discoveredDirectories = await discoverPluginDirectories(
    pluginPackageDirectory,
    pluginGlobs,
  );

  if (discoveredDirectories.length === 0) {
    throw new Error(
      `No plugins found in ${pluginPackageDirectory}. Looked for plugin.json files.`,
    );
  }

  // Apply rewrite if needed
  const pluginDirectories = rewritePluginDirectory
    ? discoveredDirectories.map((directory) => {
        const relativeDirectory = path.relative(
          pluginPackageDirectory,
          directory,
        );
        return path.join(
          pluginPackageDirectory,
          rewritePluginDirectory(relativeDirectory),
        );
      })
    : discoveredDirectories;

  const targets = await Promise.all(
    pluginDirectories.map(async (directory) => {
      const metadata = await readPluginMetadata(directory);
      return getModuleFederationTargetsForPlugin(
        metadata,
        directory,
        pluginPackageDirectory,
      );
    }),
  );

  if (targets.length === 0) {
    throw new Error(
      `No module federation targets found in ${pluginPackageDirectory}`,
    );
  }

  return Object.assign({}, ...targets) as Record<string, string>;
}
