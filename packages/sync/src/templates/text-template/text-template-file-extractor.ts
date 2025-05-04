import { mapGroupBy } from '@halfdomelabs/utils';
import { getCommonPathPrefix } from '@halfdomelabs/utils/node';
import { camelCase } from 'change-case';
import { constantCase, mapValues, uniq } from 'es-toolkit';
import path from 'node:path/posix';
import pLimit from 'p-limit';

import { getGenerationConcurrencyLimit } from '@src/utils/concurrency.js';

import type { TemplateFileExtractorFile } from '../extractor/template-file-extractor.js';
import type { TextTemplateFile, TextTemplateFileMetadata } from './types.js';

import { TemplateFileExtractor } from '../extractor/template-file-extractor.js';
import { TEXT_TEMPLATE_TYPE, textTemplateFileMetadataSchema } from './types.js';
import {
  getTextTemplateDelimiters,
  getTextTemplateVariableRegExp,
} from './utils.js';

interface TypescriptCodeEntry {
  codeBlock: string;
  exports: string[];
  imports: string[];
}

export class TextTemplateFileExtractor extends TemplateFileExtractor<
  typeof textTemplateFileMetadataSchema
> {
  public name = TEXT_TEMPLATE_TYPE;
  public metadataSchema = textTemplateFileMetadataSchema;

  protected async extractTemplateFile(
    file: TemplateFileExtractorFile<TextTemplateFileMetadata>,
  ): Promise<TypescriptCodeEntry & { originalPath: string }> {
    const sourceFileContents = await this.readSourceFile(file.path);
    // get variable values from the rendered template
    const { metadata } = file;
    const { start, end } = getTextTemplateDelimiters(file.path);

    // replace variable values with template string
    let templateContents = sourceFileContents;
    for (const [key, variable] of Object.entries(metadata.variables ?? {})) {
      const variableRegex = getTextTemplateVariableRegExp(
        variable,
        variable.value,
      );
      const newTemplateContents = templateContents.replaceAll(
        variableRegex,
        `${start}${key}${end}`,
      );
      if (newTemplateContents === templateContents) {
        throw new Error(
          `Variable ${key} with value ${variable.value} not found in template ${file.path}`,
        );
      }
      templateContents = newTemplateContents;
    }

    await this.writeTemplateFileIfModified(file, templateContents);

    const templateName = camelCase(file.metadata.name);

    return {
      codeBlock: `const ${templateName} = createTextTemplateFile(${JSON.stringify(
        {
          name: file.metadata.name,
          group: file.metadata.group,
          source: {
            path: file.metadata.template,
          },
          variables: mapValues(metadata.variables ?? {}, (variable) => ({
            description: variable.description,
            isIdentifier: variable.isIdentifier,
          })),
        } satisfies TextTemplateFile,
      )});`,
      exports: [templateName],
      imports: ['createTextTemplateFile'],
      originalPath: file.path,
    };
  }

  protected async extractTemplateFilesForGroup(
    groupName: string,
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
  ): Promise<TypescriptCodeEntry> {
    const results = await Promise.all(
      files.map((file) => this.extractTemplateFile(file)),
    );

    const originalPaths = results.map((result) => result.originalPath);
    // identify greatest common prefix
    const commonPathPrefix = getCommonPathPrefix(originalPaths);

    const groupNameVariable = `${camelCase(groupName)}Group`;

    const groupBlock = `const ${groupNameVariable} = createTextTemplateGroup({
      templates: {
        ${results
          .map(
            (result) => `${result.exports[0]}: {
          destination: '${path.relative(commonPathPrefix, result.originalPath)}',
          template: ${result.exports[0]}
        }`,
          )
          .join(',\n')}
      }
    });`;

    return {
      codeBlock: [
        ...results.map((result) => result.codeBlock),
        groupBlock,
      ].join('\n\n'),
      exports: [groupNameVariable],
      imports: [
        'createTextTemplateGroup',
        ...results.flatMap((result) => result.imports),
      ],
    };
  }

  protected async extractTemplateFilesForGenerator(
    generatorName: string,
    files: TemplateFileExtractorFile<TextTemplateFileMetadata>[],
  ): Promise<void> {
    const extractLimit = pLimit(getGenerationConcurrencyLimit());

    const filesByGroups = mapGroupBy(
      files.filter((file) => file.metadata.group),
      (file) => file.metadata.group ?? '',
    );
    const filesWithoutGroups = files.filter((file) => !file.metadata.group);

    const results = await Promise.all([
      ...[...filesByGroups].map(([groupName, files]) =>
        extractLimit(() => this.extractTemplateFilesForGroup(groupName, files)),
      ),
      ...filesWithoutGroups.map((file) =>
        extractLimit(() => this.extractTemplateFile(file)),
      ),
    ]);

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
        `import { ${uniq(results.flatMap((result) => result.imports))
          .toSorted()
          .join(',')} } from "@halfdomelabs/sync";`,
        ...results.map((result) => result.codeBlock),
        `export const ${templatesVariableName} = {
          ${results.map((result) => result.exports).join(',')}
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
