import { toCanonicalPath } from '@baseplate-dev/sync';
import { createTemplateExtractorPlugin } from '@baseplate-dev/sync/extractor-v2';
import {
  handleFileNotFoundError,
  posixJoin,
  readJsonWithSchema,
} from '@baseplate-dev/utils/node';
import { camelCase } from 'change-case';
import path from 'node:path';
import { z } from 'zod';

import type { TemplateFileOptions } from '#src/renderers/schemas/template-file-options.js';

import { normalizeTsPathToJsPath } from '#src/utils/ts-paths.js';

import { templateExtractorBarrelExportPlugin } from '../barrel-export.js';
import {
  GENERATED_PATHS_FILE_NAME,
  getPathsFileExportNames,
  writePathMapFile,
} from './paths-file.js';

export interface TemplatePathRoot {
  canonicalPath: string;
  pathRootName: string;
}

// Key is the canonical path and value is the path root name
const templatePathRootSchema = z.object({
  canonicalPath: z.string(),
  pathRootName: z.string(),
});

function getPathsRootExportName(generatorName: string): string {
  const fileExportNames = getPathsFileExportNames(generatorName);
  return fileExportNames.rootExportName;
}

export const TEMPLATE_PATHS_METADATA_FILE = '.paths-metadata.json';

const templatePathsPluginConfigSchema = z.object({
  /**
   * Whether to skip generating the paths task.
   */
  skipTaskGeneration: z.boolean().default(false),
});

/**
 * The template paths plugin is used to enable templates to get assigned a path
 * relative to their nearest path root, e.g. the feature folder or package root.
 *
 * To support such behavior, it is necessary to use the path-metadata generator
 * which writes a .paths-metadata.json to the output directory.
 */
export const templatePathsPlugin = createTemplateExtractorPlugin({
  name: 'template-paths',
  pluginDependencies: [templateExtractorBarrelExportPlugin],
  getInstance: async ({ context, api }) => {
    const barrelExportPlugin = context.getPlugin(
      templateExtractorBarrelExportPlugin.name,
    );
    const templatePathRoots = await discoverTemplatePathRoots(
      context.outputDirectory,
    );
    // Key: Generator name, Value: Map of template name to path root relative path
    const pathMapByGenerator = new Map<string, Map<string, string>>();

    function registerTemplatePathEntry(
      generatorName: string,
      templateName: string,
      pathRootRelativePath: string,
    ): void {
      const pathMap =
        pathMapByGenerator.get(generatorName) ?? new Map<string, string>();
      pathMap.set(camelCase(templateName), pathRootRelativePath);
      pathMapByGenerator.set(generatorName, pathMap);
    }

    /**
     * Gets the path of a singleton template file relative to the closest file path root.
     *
     * @param absolutePath - The absolute path of the template file.
     * @returns The relative path of the template file to the closest file path root.
     */
    function getPathRootRelativePath(absolutePath: string): string {
      const outputRelativePath = path.relative(
        context.outputDirectory,
        absolutePath,
      );
      return getTemplatePathFromRelativePath(
        outputRelativePath,
        templatePathRoots,
      );
    }

    /**
     * Resolves template paths for a given file based on its file options.
     *
     * @param fileOptions - The file options containing template path configuration.
     * @param absolutePath - The absolute path of the template file.
     * @param templateName - The name of the template (for error messages).
     * @param generatorName - The name of the generator (for error messages).
     * @returns An object containing the pathRootRelativePath and generatorTemplatePath.
     */
    function resolveTemplatePaths(
      fileOptions: TemplateFileOptions,
      absolutePath: string,
      templateName: string,
      generatorName: string,
    ): {
      pathRootRelativePath: string | undefined;
      generatorTemplatePath: string;
    } {
      const pathRootRelativePath =
        fileOptions.kind === 'singleton'
          ? (fileOptions.pathRootRelativePath ??
            getPathRootRelativePath(absolutePath))
          : undefined;

      // By default, singleton templates have the path like `feature-root/services/[file].ts`
      const generatorTemplatePath =
        fileOptions.generatorTemplatePath ??
        (pathRootRelativePath &&
          getTemplatePathFromPathRootRelativePath(pathRootRelativePath));

      if (!generatorTemplatePath) {
        throw new Error(
          `Template path is required for ${templateName} in ${generatorName}`,
        );
      }

      return { pathRootRelativePath, generatorTemplatePath };
    }

    api.registerHook('afterWrite', async () => {
      for (const [generatorName, pathMap] of pathMapByGenerator) {
        const config = context.configLookup.getPluginConfigForGenerator(
          generatorName,
          templatePathsPlugin.name,
          templatePathsPluginConfigSchema,
        );
        const { exportName } = await writePathMapFile(
          generatorName,
          pathMap,
          context,
          { skipTaskGeneration: config?.skipTaskGeneration },
        );
        barrelExportPlugin.addGeneratedBarrelExport(generatorName, {
          moduleSpecifier: `./${normalizeTsPathToJsPath(GENERATED_PATHS_FILE_NAME)}`,
          namedExport: exportName,
          name: 'paths',
        });
      }
    });

    return {
      getPathRootRelativePath,
      getTemplatePathFromPathRootRelativePath,
      registerTemplatePathEntry,
      resolveTemplatePaths,
      getPathsRootExportName,
    };
  },
});

/**
 * Gets the template path from a path root relative path by stripping the brackets and -root from the path.
 *
 * @param pathRootRelativePath - The path root relative path. (e.g. `{feature-root}/services/test.ts`)
 * @returns The template path. (e.g. `feature/services/[file].ts`)
 */
function getTemplatePathFromPathRootRelativePath(
  pathRootRelativePath: string,
): string {
  return pathRootRelativePath
    .replaceAll(/-root(?=})/g, '')
    .replaceAll(/[{}]/g, '');
}

/**
 * Discovers the template path roots from the paths-metadata.json file.
 *
 * @param outputDirectory - The output directory of the project.
 * @returns The template path roots from longest to shortest.
 */
async function discoverTemplatePathRoots(
  outputDirectory: string,
): Promise<TemplatePathRoot[]> {
  const pathsMetadataFile = path.join(
    outputDirectory,
    TEMPLATE_PATHS_METADATA_FILE,
  );
  const pathsMetadataContents = await readJsonWithSchema(
    pathsMetadataFile,
    z.array(templatePathRootSchema),
  ).catch(handleFileNotFoundError);
  if (!pathsMetadataContents) return [];
  return pathsMetadataContents.sort(
    (a, b) => b.canonicalPath.length - a.canonicalPath.length,
  );
}

/**
 * Gets the template path from a relative path.
 *
 * @param outputRelativePath - The output relative path.
 * @param templatePathRoots - The template path roots.
 * @returns The template path.
 */
function getTemplatePathFromRelativePath(
  outputRelativePath: string,
  templatePathRoots: TemplatePathRoot[],
): string {
  const canonicalPath = toCanonicalPath(outputRelativePath);
  const templatePathRoot = templatePathRoots.find((templatePathRoot) =>
    `${canonicalPath}/`.startsWith(`${templatePathRoot.canonicalPath}/`),
  );
  if (!templatePathRoot) {
    throw new Error(`Could not find template path root for ${canonicalPath}`);
  }
  return posixJoin(
    `{${templatePathRoot.pathRootName}}`,
    path.posix.relative(templatePathRoot.canonicalPath, canonicalPath),
  );
}
