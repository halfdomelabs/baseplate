import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { TemplateExtractorGeneratorEntry } from '../configs/index.js';
import type { TemplateExtractorContext } from './template-extractor-context.js';

import {
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
  TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY,
} from '../constants/directories.js';

/**
 * The API for the template extractor with helper functions for writing files.
 */
export class TemplateExtractorApi {
  constructor(
    protected context: TemplateExtractorContext,
    protected extractorName: string,
  ) {}

  async readOutputFileBuffer(absolutePath: string): Promise<Buffer> {
    const file = await fs.readFile(absolutePath).catch(handleFileNotFoundError);

    if (!file) {
      throw new Error(`Output file not found: ${absolutePath}`);
    }
    return file;
  }

  async readOutputFile(absolutePath: string): Promise<string> {
    const file = await this.readOutputFileBuffer(absolutePath);
    return file.toString('utf8');
  }

  /**
   * Gets the generator info for the given generator name.
   *
   * @param generatorName - The name of the generator.
   * @returns The generator info.
   */
  getGeneratorInfo(generatorName: string): TemplateExtractorGeneratorEntry {
    const generatorInfo =
      this.context.configLookup.getExtractorConfig(generatorName);

    if (!generatorInfo) {
      throw new Error(`Generator config not found: ${generatorName}`);
    }

    return generatorInfo;
  }

  /**
   * Gets the directory of the given generator.
   *
   * @param generatorName - The name of the generator.
   * @returns The directory of the generator.
   */
  getGeneratorDirectory(generatorName: string): string {
    const generatorInfo = this.getGeneratorInfo(generatorName);

    return generatorInfo.generatorDirectory;
  }

  /**
   * Writes a template file to the generator's templates directory.
   *
   * @param generatorName - The name of the generator.
   * @param generatorTemplatePath - The path of the template file in the generator's templates directory.
   * @param contents - The contents of the template file.
   */
  async writeTemplateFile(
    generatorName: string,
    generatorTemplatePath: string,
    contents: string | Buffer,
  ): Promise<void> {
    const generatorDirectory = this.getGeneratorDirectory(generatorName);
    const absolutePath = path.join(
      generatorDirectory,
      TEMPLATE_EXTRACTOR_TEMPLATES_DIRECTORY,
      generatorTemplatePath,
    );

    await this.context.fileContainer.writeFile(absolutePath, contents);
  }

  /**
   * Writes a generated file to the generator's generated directory.
   *
   * @param generatorName - The name of the generator.
   * @param relativePath - The relative path of the file in the generator's generated directory.
   * @param contents - The contents of the file.
   */
  async writeGeneratedFile(
    generatorName: string,
    relativePath: string,
    contents: string | Buffer,
  ): Promise<void> {
    const generatorDirectory = this.getGeneratorDirectory(generatorName);
    const absolutePath = path.join(
      generatorDirectory,
      TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
      relativePath,
    );
    await this.context.fileContainer.writeFile(absolutePath, contents);
  }
}
