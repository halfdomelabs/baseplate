import { mapGroupBy } from '@halfdomelabs/utils';
import { camelCase } from 'change-case';
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
    for (const [key, variable] of Object.entries(metadata.variables ?? {})) {
      if (!templateContents.includes(variable.value)) {
        throw new Error(
          `Variable ${key} with value ${variable.value} not found in template ${file.path}`,
        );
      }
      templateContents = templateContents.replaceAll(
        variable.value,
        `{{${key}}}`,
      );
    }

    await this.writeTemplateFileIfModified(file, templateContents);

    const templateName = camelCase(file.metadata.name);

    return {
      typescriptCodeBlock: `const ${templateName} = createTextTemplateFile(${JSON.stringify(
        {
          name: file.metadata.name,
          source: {
            path: file.metadata.template,
          },
          variables: mapValues(metadata.variables ?? {}, (variable) => ({
            description: variable.description,
          })),
        } satisfies TextTemplateFile,
      )});`,
      typescriptExports: [templateName],
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

    if (!generatorName.includes('#')) {
      throw new Error(
        `Generator name ${generatorName} is not in the correct format.
         Please use the format <package-name>#<generator-name>.`,
      );
    }
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
