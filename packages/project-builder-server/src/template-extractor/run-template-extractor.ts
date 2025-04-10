import type { SchemaParserContext } from '@halfdomelabs/project-builder-lib';
import type { Logger, TemplateFileExtractorCreator } from '@halfdomelabs/sync';

import {
  RawTemplateFileExtractor,
  runTemplateFileExtractors,
  TextTemplateFileExtractor,
} from '@halfdomelabs/sync';

const GENERATOR_PACKAGES = [
  '@halfdomelabs/core-generators',
  '@halfdomelabs/fastify-generators',
  '@halfdomelabs/react-generators',
];

const TEMPLATE_FILE_EXTRACTOR_CREATORS: TemplateFileExtractorCreator[] = [
  (context) => new TextTemplateFileExtractor(context),
  (context) => new RawTemplateFileExtractor(context),
];

function buildGeneratorPackageMap(
  context: SchemaParserContext,
): Map<string, string> {
  const generatorPackageMap = new Map<string, string>();
  for (const plugin of context.pluginStore.availablePlugins) {
    generatorPackageMap.set(
      plugin.metadata.packageName,
      plugin.metadata.pluginDirectory,
    );
  }
  // attach generator packages
  for (const packageName of GENERATOR_PACKAGES) {
    generatorPackageMap.set(packageName, import.meta.resolve(packageName));
  }
  return generatorPackageMap;
}

export async function runTemplateExtractorsForDirectory(
  directory: string,
  context: SchemaParserContext,
  logger: Logger,
): Promise<void> {
  const generatorPackageMap = buildGeneratorPackageMap(context);
  await runTemplateFileExtractors(
    TEMPLATE_FILE_EXTRACTOR_CREATORS,
    directory,
    generatorPackageMap,
    logger,
  );
}
