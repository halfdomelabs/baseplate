import { dirExists, removeEmptyDirectories } from '@baseplate-dev/utils/node';
import { globby } from 'globby';
import fsAdapter from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateExtractorContext } from '../runner/template-extractor-context.js';

import { EXTRACTOR_CONFIG_FILENAME } from '../../constants.js';
import {
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY,
} from '../constants/directories.js';

/**
 * Cleans up template and generated files that are not referenced in the extractor.json
 * for the specified generators.
 *
 * @param generatorNames - Array of generator names to clean up files for
 * @param context - Template extractor context containing config lookup and file container
 * @throws Error if no config is found for a generator
 */
export async function cleanupUnusedTemplateFiles(
  generatorNames: string[],
  context: TemplateExtractorContext,
): Promise<void> {
  for (const generatorName of generatorNames) {
    const generatorConfig =
      context.configLookup.getExtractorConfig(generatorName);
    if (!generatorConfig) {
      throw new Error(
        `No '${EXTRACTOR_CONFIG_FILENAME}' found for generator: ${generatorName}`,
      );
    }

    const { generatorDirectory, config } = generatorConfig;
    const { templates } = config;

    // Get all template paths from extractor.json
    const referencedTemplatePaths = new Set(
      Object.values(templates).map((t) => t.sourceFile),
    );

    // Clean up template files
    await cleanupTemplateDirectory(
      generatorDirectory,
      referencedTemplatePaths,
      context,
    );

    // Clean up generated files
    await cleanupGeneratedDirectory(generatorDirectory, context);
  }
}

/**
 * Cleans up template files that are not referenced in extractor.json
 */
async function cleanupTemplateDirectory(
  generatorDirectory: string,
  referencedTemplatePaths: Set<string>,
  context: TemplateExtractorContext,
): Promise<void> {
  const templatesDirectory = path.join(
    generatorDirectory,
    TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY,
  );

  if (!(await dirExists(templatesDirectory))) {
    return;
  }

  // Find all files in the templates directory
  const allTemplateFiles = await globby(['**/*'], {
    cwd: templatesDirectory,
    absolute: false,
    onlyFiles: true,
    fs: fsAdapter,
    gitignore: true,
  });

  // Delete files not referenced in extractor.json
  for (const templateFile of allTemplateFiles) {
    if (!referencedTemplatePaths.has(templateFile)) {
      const absolutePath = path.join(templatesDirectory, templateFile);
      context.logger.info(`Deleting unused template file: ${absolutePath}`);
      await fs.unlink(absolutePath);
    }
  }

  // Clean up empty directories
  await removeEmptyDirectories(templatesDirectory);
}

/**
 * Cleans up all files in the generated directory that are not being written
 * by the file container in this extraction run.
 */
async function cleanupGeneratedDirectory(
  generatorDirectory: string,
  context: TemplateExtractorContext,
): Promise<void> {
  const generatedDirectory = path.join(
    generatorDirectory,
    TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  );

  if (!(await dirExists(generatedDirectory))) {
    return;
  }

  // Get files being written in this extraction run
  const filesBeingWritten = new Set(
    [...context.fileContainer.getFiles().keys()]
      .filter((filePath) => filePath.startsWith(generatedDirectory))
      .map((filePath) => path.relative(generatedDirectory, filePath)),
  );

  // Find all existing files in the generated directory
  const allGeneratedFiles = await globby(['**/*'], {
    cwd: generatedDirectory,
    absolute: false,
    onlyFiles: true,
    fs: fsAdapter,
    gitignore: true,
  });

  // Delete files not being written in this extraction
  for (const generatedFile of allGeneratedFiles) {
    if (!filesBeingWritten.has(generatedFile)) {
      const absolutePath = path.join(generatedDirectory, generatedFile);
      context.logger.info(`Deleting unused generated file: ${absolutePath}`);
      await fs.unlink(absolutePath);
    }
  }

  // Clean up empty directories
  await removeEmptyDirectories(generatedDirectory);
}
