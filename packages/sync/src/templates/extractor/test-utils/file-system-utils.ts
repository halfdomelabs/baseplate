/**
 * Helper to create test files structure
 */
export function createTestFiles(structure: {
  generators?: Record<
    string,
    {
      'extractor.json'?: unknown;
      'index.ts'?: string;
      templates?: Record<string, string>;
    }
  >;
  metadata?: {
    '.paths-metadata.json'?: {
      canonicalPath: string;
      pathRootName: string;
    }[];
  };
}): Record<string, string> {
  const files: Record<string, string> = {};

  // Add generator files
  if (structure.generators) {
    for (const [generatorPath, generatorFiles] of Object.entries(
      structure.generators,
    )) {
      if (generatorFiles['extractor.json']) {
        files[`${generatorPath}/extractor.json`] = JSON.stringify(
          generatorFiles['extractor.json'],
        );
      }
      if (generatorFiles['index.ts']) {
        files[`${generatorPath}/index.ts`] = generatorFiles['index.ts'];
      }
      if (generatorFiles.templates) {
        for (const [templatePath, templateContent] of Object.entries(
          generatorFiles.templates,
        )) {
          files[`${generatorPath}/templates/${templatePath}`] = templateContent;
        }
      }
    }
  }

  // Add metadata files
  if (structure.metadata) {
    for (const [metadataFile, content] of Object.entries(structure.metadata)) {
      files[metadataFile] = JSON.stringify(content);
    }
  }

  return files;
}
