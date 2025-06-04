import type { z } from 'zod';

import {
  handleFileNotFoundError,
  safePathJoin,
} from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  TemplateFileMetadataBase,
  templateFileMetadataBaseSchema,
} from '../metadata/index.js';
import type { TemplateExtractorGeneratorEntry } from './configs/template-extractor-config-lookup.js';
import type { TemplateFileExtractorContext } from './types.js';

import { GENERATOR_INFO_FILENAME } from '../constants.js';
import { formatGeneratedTemplateContents } from '../utils/formatter.js';

export interface TemplateFileExtractorFile<
  TMetadata extends TemplateFileMetadataBase = TemplateFileMetadataBase,
> {
  /**
   * The path of the file.
   */
  path: string;
  /**
   * The metadata for the file.
   */
  metadata: TMetadata;
}

export interface TemplateFileExtractorGeneratorInfo {
  /**
   * The name of the generator.
   */
  name: string;
  /**
   * The base directory of the generator.
   */
  baseDirectory: string;
  /**
   * The package path of the generator.
   */
  packagePath: string;
}

/**
 * Base class for template file extractors.
 *
 * @template T - The metadata schema for the template files.
 *
 */
export abstract class TemplateFileExtractor<
  TGeneratorTemplateMetadata extends z.ZodSchema,
  TOutputTemplateMetadata extends
    z.ZodSchema = typeof templateFileMetadataBaseSchema,
> {
  constructor(protected readonly context: TemplateFileExtractorContext) {}

  abstract name: string;
  abstract generatorTemplateMetadataSchema: TGeneratorTemplateMetadata;
  abstract outputTemplateMetadataSchema: TOutputTemplateMetadata;

  /**
   * Reads a source file and returns its contents as a Buffer.
   */
  protected async readSourceFileBuffer(path: string): Promise<Buffer> {
    const fileBuffer = await fs.readFile(path).catch(handleFileNotFoundError);
    if (!fileBuffer) {
      throw new Error(`Could not find template file in project: ${path}`);
    }
    return fileBuffer;
  }

  protected getProjectBaseDirectory(): string {
    return this.context.baseDirectory;
  }

  protected async getGeneratorInfo(
    generatorName: string,
  ): Promise<TemplateExtractorGeneratorEntry> {
    const generatorConfig =
      await this.context.configLookup.getExtractorConfig(generatorName);
    if (!generatorConfig) {
      throw new Error(
        `Could not find generator info for generator: ${generatorName}.
         Please ensure that the generator is present in the ${GENERATOR_INFO_FILENAME} file.`,
      );
    }
    return generatorConfig;
  }

  /**
   * Writes a generator file if it has been modified.
   * @returns `true` if the file was written, `false` if it was not modified.
   */
  protected async writeGeneratorFileIfModified(
    generatorName: string,
    generatorRelativePath: string,
    contents: string | Buffer,
  ): Promise<boolean> {
    const generatorInfo = await this.getGeneratorInfo(generatorName);
    const generatorFilePath = safePathJoin(
      generatorInfo.generatorDirectory,
      generatorRelativePath,
    );
    const formattedContents =
      typeof contents === 'string'
        ? await formatGeneratedTemplateContents(contents, generatorFilePath)
        : contents;
    const bufferContents =
      typeof formattedContents === 'string'
        ? Buffer.from(formattedContents)
        : formattedContents;
    const existingContents = await fs
      .readFile(generatorFilePath)
      .catch(handleFileNotFoundError);
    if (existingContents?.equals(bufferContents)) {
      return false;
    }
    await fs.mkdir(path.dirname(generatorFilePath), { recursive: true });
    await fs.writeFile(generatorFilePath, bufferContents);
    return true;
  }

  /**
   * Writes a template file if it has been modified.
   * @returns `true` if the file was written, `false` if it was not modified.
   */
  protected async writeTemplateFileIfModified(
    file: TemplateFileExtractorFile,
    contents: string | Buffer,
  ): Promise<boolean> {
    return this.writeGeneratorFileIfModified(
      file.metadata.generator,
      path.join('templates', file.metadata.template),
      contents,
    );
  }

  /**
   * Writes a generated typescript file if it has been modified in the `generated` directory.
   * @returns `true` if the file was written, `false` if it was not modified.
   */
  protected async writeGeneratedTypescriptFileIfModified(
    generatorName: string,
    destination: string,
    contents: string,
  ): Promise<boolean> {
    const formattedContents = await formatGeneratedTemplateContents(
      contents,
      destination,
    );
    return this.writeGeneratorFileIfModified(
      generatorName,
      path.join('generated', destination),
      formattedContents,
    );
  }

  /**
   * Deletes a generated typescript file from the `generated` directory.
   */
  protected async deleteGeneratedTypescriptFile(
    generatorName: string,
    destination: string,
  ): Promise<void> {
    const generatorInfo = await this.getGeneratorInfo(generatorName);
    const generatorFilePath = path.join(
      generatorInfo.generatorDirectory,
      path.join('generated', destination),
    );
    await fs.unlink(generatorFilePath).catch(handleFileNotFoundError);
  }

  /**
   * Reads a source file and returns its contents.
   */
  protected async readSourceFile(path: string): Promise<string> {
    const buffer = await this.readSourceFileBuffer(path);
    return buffer.toString('utf8');
  }

  /**
   * Extracts template files from the source files.
   */
  abstract extractTemplateFiles(
    files: TemplateFileExtractorFile<z.infer<TOutputTemplateMetadata>>[],
  ): Promise<void>;
}

export type TemplateFileExtractorCreator = (
  context: TemplateFileExtractorContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- allow for any metadata schema
) => TemplateFileExtractor<any>;
