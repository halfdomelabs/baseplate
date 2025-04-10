import { mapGroupBy } from '@halfdomelabs/utils';
import { constantCase, pascalCase } from 'change-case';
import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '@src/utils/concurrency.js';

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
    const sourceFileContents = await this.readSourceFile(file.path);
    await this.writeTemplateFileIfModified(file, sourceFileContents);

    const templateName = pascalCase(file.metadata.name);

    const rawTemplateFileVariableName = `${templateName}RawTemplate`;

    return {
      typescriptCodeBlock: `const ${rawTemplateFileVariableName} = createRawTemplateFile(${JSON.stringify(
        {
          name: file.metadata.name,
          source: {
            path: file.metadata.template,
          },
        } satisfies RawTemplateFile,
      )});`,
      typescriptExports: [rawTemplateFileVariableName],
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

    const templatesVariableName = `${constantCase(generatorName.split('#')[1])}_RAW_TEMPLATES`;

    // write a Typescript templates file that exports the appropriate file templates
    await this.writeGeneratedTypescriptFileIfModified(
      generatorName,
      'raw-templates.ts',
      [
        'import { createRawTemplateFile } from "@halfdomelabs/sync";',
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
