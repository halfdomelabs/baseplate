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
    // get variable values from the rendered template
    const { metadata } = file;

    // replace variable values with template string
    let templateContents = sourceFileContents;
    for (const [key, variable] of Object.entries(metadata.variables)) {
      templateContents = templateContents.replace(variable.value, `{{${key}}}`);
    }

    await this.writeTemplateFileIfModified(file, templateContents);
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
  ): Promise<void> {
    for (const file of files) {
      await this.extractTemplateFile(file);
    }
  }
}
