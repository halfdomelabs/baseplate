import type { TemplateFileExtractorFile } from '../extractor/template-file-extractor.js';
import type { TextTemplateFileMetadata } from './types.js';

import { TemplateFileExtractor } from '../extractor/template-file-extractor.js';
import { TEXT_TEMPLATE_TYPE, textTemplateFileMetadataSchema } from './types.js';

export class TextTemplateFileExtractor extends TemplateFileExtractor<
  typeof textTemplateFileMetadataSchema
> {
  public name = TEXT_TEMPLATE_TYPE;
  public metadataSchema = textTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<TextTemplateFileMetadata>,
  ): Promise<void> {
    const sourceFileContents = await this.readSourceFile(file.path);
    await this.writeTemplateFileIfModified(file, sourceFileContents);
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
  ): Promise<void> {
    for (const file of files) {
      await this.extractTemplateFile(file);
    }
  }
}
