import { mapGroupBy } from '@baseplate-dev/utils';
import { camelCase, constantCase } from 'change-case';
import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '#src/utils/concurrency.js';

import type { TemplateFileExtractorFile } from '../extractor/template-file-extractor.js';
import type { RawTemplateFile, RawTemplateFileMetadata } from './types.js';

import { TemplateFileExtractor } from '../extractor/template-file-extractor.js';
import { RAW_TEMPLATE_TYPE, rawTemplateFileMetadataSchema } from './types.js';

export class RawTemplateFileExtractor extends TemplateFileExtractor<
  typeof rawTemplateFileMetadataSchema
> {
  public name = RAW_TEMPLATE_TYPE;
  public metadataSchema = rawTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<RawTemplateFileMetadata>,
  ): Promise<{ typescriptCodeBlock: string; typescriptExports: string[] }> {
    const sourceFileContents = await this.readSourceFileBuffer(file.path);
    await this.writeTemplateFileIfModified(file, sourceFileContents);

    const templateName = camelCase(file.metadata.name);

    return {
      typescriptCodeBlock: `const ${templateName} = createRawTemplateFile(${JSON.stringify(
        {
          name: file.metadata.name,
          source: {
            path: file.metadata.template,
          },
        } satisfies RawTemplateFile,
      )});`,
      typescriptExports: [templateName],
    };
  }

  protected async extractTemplateFilesForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<RawTemplateFileMetadata>[],
  ): Promise<void> {
    const extractLimit = pLimit(getGenerationConcurrencyLimit());

    const results = await Promise.all(
      files.map((file) =>
        extractLimit(async () => this.extractTemplateFile(file)),
      ),
    );

    if (!generatorName.includes('#')) {
      throw new Error(
        `Generator name ${generatorName} is not in the correct format.
         Please use the format <package-name>#<generator-name>.`,
      );
    }
    const templatesVariableName = `${constantCase(generatorName.split('#')[1])}_RAW_TEMPLATES`;

    // write a Typescript templates file that exports the appropriate file templates
    await this.writeGeneratedTypescriptFileIfModified(
      generatorName,
      'raw-templates.ts',
      [
        'import { createRawTemplateFile } from "@baseplate-dev/sync";',
        ...results.map((result) => result.typescriptCodeBlock),
        `export const ${templatesVariableName} = {
          ${results.map((result) => result.typescriptExports).join(',')}
        }`,
      ].join('\n\n'),
    );
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<RawTemplateFileMetadata>[],
  ): Promise<void> {
    const filesByGenerator = mapGroupBy(
      files,
      (file) => file.metadata.generator,
    );
    for (const [generator, files] of filesByGenerator) {
      await this.extractTemplateFilesForGenerator(generator, files);
    }
  }
}
