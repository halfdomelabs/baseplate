import { mapGroupBy } from '@halfdomelabs/utils';
import { pascalCase } from 'change-case';
import { constantCase, mapValues } from 'es-toolkit';
import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '@src/utils/concurrency.js';

import type { TemplateFileExtractorFile } from '../extractor/template-file-extractor.js';
import type { TextTemplateFile, TextTemplateFileMetadata } from './types.js';

import { TemplateFileExtractor } from '../extractor/template-file-extractor.js';
import { TEXT_TEMPLATE_TYPE, textTemplateFileMetadataSchema } from './types.js';

export class TextTemplateFileExtractor extends TemplateFileExtractor<
  typeof textTemplateFileMetadataSchema
> {
  public name = TEXT_TEMPLATE_TYPE;
  public metadataSchema = textTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<TextTemplateFileMetadata>,
  ): Promise<{ typescriptCodeBlock: string; typescriptExports: string[] }> {
    const sourceFileContents = await this.readSourceFile(file.path);
    // get variable values from the rendered template
    const { metadata } = file;

    // replace variable values with template string
    let templateContents = sourceFileContents;
    for (const [key, variable] of Object.entries(metadata.variables)) {
      if (!templateContents.includes(variable.value)) {
        throw new Error(
          `Variable value not found in template: ${variable.value} (template: ${file.path})`,
        );
      }
      templateContents = templateContents.replaceAll(
        variable.value,
        `{{${key}}}`,
      );
    }

    await this.writeTemplateFileIfModified(file, templateContents);

    const templateName = pascalCase(file.metadata.name);

    const textTemplateFileVariableName = `${templateName}TextTemplate`;

    return {
      typescriptCodeBlock: `const ${textTemplateFileVariableName} = createTextTemplateFile(${JSON.stringify(
        {
          name: file.metadata.name,
          source: {
            path: file.metadata.template,
          },
          variables: mapValues(metadata.variables, (variable) => ({
            description: variable.description,
          })),
        } satisfies TextTemplateFile,
      )});`,
      typescriptExports: [textTemplateFileVariableName],
    };
  }

  protected async extractTemplateFilesForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
  ): Promise<void> {
    const extractLimit = pLimit(getGenerationConcurrencyLimit());

    const results = await Promise.all(
      files.map((file) =>
        extractLimit(async () => this.extractTemplateFile(file)),
      ),
    );

    const templatesVariableName = `${constantCase(generatorName.split('#')[1])}_TEXT_TEMPLATES`;

    // write a Typescript templates file that exports the appropriate file templates
    await this.writeGeneratedTypescriptFileIfModified(
      generatorName,
      'text-templates.ts',
      [
        'import { createTextTemplateFile } from "@halfdomelabs/sync";',
        ...results.map((result) => result.typescriptCodeBlock),
        `export const ${templatesVariableName} = {
          ${results.map((result) => result.typescriptExports).join(',')}
        }`,
      ].join('\n\n'),
    );
  }

  async extractTemplateFiles(
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
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
