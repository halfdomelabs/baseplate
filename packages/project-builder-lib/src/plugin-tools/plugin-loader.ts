import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

import {
  PluginManifestJson,
  PluginMetadata,
  PluginMetadataWithPaths,
  pluginManifestJsonSchema,
  pluginMetadataSchema,
} from '../plugins/index.js';
import { notEmpty } from '@src/utils/array.js';

class PluginLoaderError extends Error {
  constructor(
    message: string,
    public innerError?: unknown,
  ) {
    super(
      `Error loading plugin (${message}): ${innerError instanceof Error ? innerError.message : String(innerError)}`,
    );
    this.name = 'PluginLoaderError';
  }
}

async function fileExists(path: string): Promise<boolean> {
  return fs
    .access(path)
    .then(() => true)
    .catch(() => false);
}

async function readManifestJson(
  pluginPackagePath: string,
): Promise<PluginManifestJson> {
  const manifestJsonPath = path.join(pluginPackagePath, 'manifest.json');

  if (!(await fileExists(manifestJsonPath))) {
    throw new Error(
      `Package ${pluginPackagePath} does not have a valid manifest.json file.`,
    );
  }

  return await fs
    .readFile(manifestJsonPath, 'utf-8')
    .then((data) => pluginManifestJsonSchema.parse(JSON.parse(data)));
}

export async function readMetadataJson(
  directory: string,
): Promise<PluginMetadata> {
  const metadataJsonFilename = path.join(directory, 'metadata.json');
  try {
    if (!(await fileExists(metadataJsonFilename))) {
      throw new Error(
        `Plugin metadata file not found: ${metadataJsonFilename}`,
      );
    }
    return fs
      .readFile(metadataJsonFilename, 'utf-8')
      .then((data) => pluginMetadataSchema.parse(JSON.parse(data)));
  } catch (err) {
    throw new PluginLoaderError(
      `Unable to read plugin metadata ${metadataJsonFilename}`,
      err,
    );
  }
}

const ENTRYPOINT_TYPES = ['node', 'web', 'common'] as const;
type EntrypointType = (typeof ENTRYPOINT_TYPES)[number];

const NODE_ENTRYPOINT_TYPES: EntrypointType[] = ['node', 'common'];
const WEB_ENTRYPOINT_TYPES: EntrypointType[] = ['web', 'common'];

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

export async function getPluginEntrypoints(
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
      moduleDirectoryPaths.map(async (moduleDirectoryPath) => {
        return await Promise.all(
          ENTRYPOINT_TYPES.map(async (entrypoint) => {
            const entrypointPath = await findJavascriptFile(
              path.join(moduleDirectoryPath, entrypoint),
            );
            if (!entrypointPath) {
              return;
            }
            return { type: entrypoint, path: entrypointPath };
          }),
        );
      }),
    );

    return moduleEntrypoints.flat().filter(notEmpty);
  } catch (err) {
    throw new PluginLoaderError(
      `Unable to find plugin entrypoints in ${pluginDirectory}`,
      err,
    );
  }
}

function getWebEntrypointImport(
  pluginName: string,
  pluginDirectory: string,
  entrypointPath: string,
): string {
  const pathWithoutExtension = entrypointPath.replace(/\.[jt]sx?$/, '');
  const relativeEntrypoint = path.relative(
    pluginDirectory,
    pathWithoutExtension,
  );
  return `${pluginName}/${relativeEntrypoint}`;
}

export async function populatePluginMetadataWithPaths(
  metadata: PluginMetadata,
  packageName: string,
  pluginDirectory: string,
  webBuildDirectory: string,
): Promise<PluginMetadataWithPaths> {
  try {
    const entrypoints = await getPluginEntrypoints(metadata, pluginDirectory);
    const nodeEntrypoints = entrypoints.filter((n) =>
      NODE_ENTRYPOINT_TYPES.includes(n.type),
    );
    const webEntrypoints = entrypoints.filter((n) =>
      WEB_ENTRYPOINT_TYPES.includes(n.type),
    );
    return {
      ...metadata,
      // URL safe ID
      id: `${packageName
        .replace(/^@/, '')
        .replace(/[^a-z0-9/]+/g, '-')
        .replace(/\//g, '_')}_${metadata.name.replace(/[^a-z0-9]+/g, '-')}`,
      packageName,
      pluginDirectory,
      webBuildDirectory,
      nodeModulePaths: nodeEntrypoints.map((e) => e.path),
      webModulePaths: webEntrypoints.map((e) =>
        getWebEntrypointImport(metadata.name, pluginDirectory, e.path),
      ),
    };
  } catch (err) {
    throw new PluginLoaderError(
      'Unable to populate plugin metadata with paths',
      err,
    );
  }
}

export async function getPluginDirectories(
  pluginPackageDirectory: string,
  manifest: PluginManifestJson,
): Promise<string[]> {
  const pluginDirectories = await globby(manifest.plugins, {
    cwd: pluginPackageDirectory,
    onlyDirectories: true,
    expandDirectories: false,
  });

  return pluginDirectories.map((pluginDirectory) =>
    path.join(pluginPackageDirectory, pluginDirectory),
  );
}

/**
 * Finds the available plugins in a package.
 */
export async function loadPluginsInPackage(
  pluginPackageDirectory: string,
  packageName: string,
): Promise<PluginMetadataWithPaths[]> {
  // Look for manifest.json file
  const manifest = await readManifestJson(pluginPackageDirectory);
  const pluginDirectories = await getPluginDirectories(
    pluginPackageDirectory,
    manifest,
  );

  // Load the plugins
  const plugins = await Promise.all(
    pluginDirectories.map(async (directory) => {
      const metadata = await readMetadataJson(directory);
      if (!metadata) {
        return undefined;
      }
      return populatePluginMetadataWithPaths(
        metadata,
        packageName,
        directory,
        path.join(pluginPackageDirectory, manifest.webBuild),
      );
    }),
  );
  return plugins.filter(notEmpty);
}

async function getModuleFederationTargetsForPlugin(
  metadata: PluginMetadata,
  pluginDirectory: string,
  pluginPackageDirectory: string,
): Promise<Record<string, string>> {
  const entrypoints = await getPluginEntrypoints(metadata, pluginDirectory);

  const pluginTargets = entrypoints
    .filter((e) => WEB_ENTRYPOINT_TYPES.includes(e.type))
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
  const manifest = await readManifestJson(pluginPackageDirectory);
  const pluginDirectories = await getPluginDirectories(
    pluginPackageDirectory,
    manifest,
  );
  const rewrittenPluginDirectories = rewritePluginDirectory
    ? pluginDirectories.map((directory) => {
        const relativeDirectory = path.relative(
          pluginPackageDirectory,
          directory,
        );
        return path.join(
          pluginPackageDirectory,
          rewritePluginDirectory(relativeDirectory),
        );
      })
    : pluginDirectories;
  const federationTargets = await Promise.all(
    rewrittenPluginDirectories.map(async (directory) => {
      const metadata = await readMetadataJson(directory);
      return getModuleFederationTargetsForPlugin(
        metadata,
        directory,
        pluginPackageDirectory,
      );
    }),
  );
  return Object.assign(
    {},
    ...federationTargets.filter(notEmpty).flat(),
  ) as Record<string, string>;
}
