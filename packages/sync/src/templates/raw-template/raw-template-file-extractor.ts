import type { TemplateFileExtractorFile } from '../extractor/template-file-extractor.js';
import type { RawTemplateFileMetadata } from './types.js';

import { TemplateFileExtractor } from '../extractor/template-file-extractor.js';
import { RAW_TEMPLATE_TYPE, rawTemplateFileMetadataSchema } from './types.js';

export class RawTemplateFileExtractor extends TemplateFileExtractor<
  typeof rawTemplateFileMetadataSchema
> {
  public name = RAW_TEMPLATE_TYPE;
  public metadataSchema = rawTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<RawTemplateFileMetadata>,
  ): Promise<void> {
    const sourceFileContents = await this.readSourceFile(file.path);
    await this.writeTemplateFileIfModified(file, sourceFileContents);
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<RawTemplateFileMetadata>[],
  ): Promise<void> {
    for (const file of files) {
      await this.extractTemplateFile(file);
    }
  }
}
