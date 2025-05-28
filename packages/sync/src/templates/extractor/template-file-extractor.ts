import type { z } from 'zod';

import { handleFileNotFoundError } from '@halfdomelabs/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import type { Logger } from '#src/utils/evented-logger.js';

import type {
  TemplateFileMetadataBase,
  templateFileMetadataBaseSchema,
} from '../metadata/index.js';

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

export interface TemplateFileExtractorContext {
  /**
   * A map of generator name to its info.
   */
  generatorInfoMap: Map<string, TemplateFileExtractorGeneratorInfo>;
  /**
   * The logger to use.
   */
  logger: Logger;
  /**
   * The base directory of the project.
   */
  baseDirectory: string;
}

export abstract class TemplateFileExtractor<
  T extends z.ZodSchema = typeof templateFileMetadataBaseSchema,
> {
  constructor(protected readonly context: TemplateFileExtractorContext) {}

  abstract name: string;
  abstract metadataSchema: T;

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

  protected getGeneratorBaseDirectory(generatorName: string): string {
    const generatorInfo = this.context.generatorInfoMap.get(generatorName);
    if (!generatorInfo) {
      throw new Error(
        `Could not find generator info for generator: ${generatorName}.
         Please ensure that the generator is present in the ${GENERATOR_INFO_FILENAME} file.`,
      );
    }
    return generatorInfo.baseDirectory;
  }

  protected getGeneratorPackagePath(generatorName: string): string {
    const generatorInfo = this.context.generatorInfoMap.get(generatorName);
    if (!generatorInfo) {
      throw new Error(
        `Could not find generator info for generator: ${generatorName}.
         Please ensure that the generator is present in the ${GENERATOR_INFO_FILENAME} file.`,
      );
    }
    return generatorInfo.packagePath;
  }

  protected getTemplatePathForFile(file: TemplateFileExtractorFile): string {
    return path.join(
      this.getGeneratorBaseDirectory(file.metadata.generator),
      'templates',
      file.metadata.template,
    );
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
    const generatorFilePath = path.join(
      this.getGeneratorBaseDirectory(generatorName),
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

  protected async deleteGeneratedTypescriptFile(
    generatorName: string,
    destination: string,
  ): Promise<void> {
    const generatorFilePath = path.join(
      this.getGeneratorBaseDirectory(generatorName),
      path.join('generated', destination),
    );
    await fs.unlink(generatorFilePath).catch(handleFileNotFoundError);
  }

  protected async readSourceFile(path: string): Promise<string> {
    const buffer = await this.readSourceFileBuffer(path);
    return buffer.toString('utf8');
  }

  abstract extractTemplateFiles(
    files: TemplateFileExtractorFile<z.infer<T>>[],
  ): Promise<void>;
}

export type TemplateFileExtractorCreator = (
  context: TemplateFileExtractorContext,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- allow for any metadata schema
) => TemplateFileExtractor<any>;
