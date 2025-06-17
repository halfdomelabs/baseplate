import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';

import { formatGeneratedTemplateContents } from '#src/templates/utils/formatter.js';

/**
 * A container for files that are generated
 */
export class TemplateExtractorFileContainer {
  private files = new Map<string, string | Buffer>();

  constructor(private readonly packageDirectories: string[]) {}

  /**
   * Writes a file to the container.
   *
   * @param filePath - The path of the file to write.
   * @param contents - The contents of the file to write.
   */
  async writeFile(filePath: string, contents: string | Buffer): Promise<void> {
    if (this.files.has(filePath)) {
      throw new Error(`File already written: ${filePath}`);
    }
    const resolvedPath = path.resolve(filePath);
    if (!this.packageDirectories.some((dir) => resolvedPath.startsWith(dir))) {
      throw new Error(
        `Cannot write file outside of package directories: ${resolvedPath}. Package directories: ${this.packageDirectories.join(', ')}`,
      );
    }

    // Format the file contents immediately
    const formattedContents =
      typeof contents === 'string'
        ? await formatGeneratedTemplateContents(contents, filePath).catch(
            (err: unknown) => {
              console.debug('File dump:');
              console.debug(contents);
              throw enhanceErrorWithContext(
                err,
                `Failed to format template contents for ${filePath}`,
              );
            },
          )
        : contents;

    this.files.set(resolvedPath, formattedContents);
  }

  private async commitFile(
    filePath: string,
    contents: string | Buffer,
  ): Promise<void> {
    // only commit file if it has changed
    const contentsBuffer = Buffer.isBuffer(contents)
      ? contents
      : Buffer.from(contents);
    const existingContents = await fs
      .readFile(filePath)
      .catch(handleFileNotFoundError);
    if (existingContents?.equals(contentsBuffer)) {
      return;
    }
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, contentsBuffer);
  }

  /**
   * Commits the files to the filesystem.
   */
  async commit(): Promise<void> {
    for (const [filePath, contents] of this.files) {
      await this.commitFile(filePath, contents);
    }
  }

  /**
   * Get the files map for testing purposes.
   * @internal
   */
  getFiles(): ReadonlyMap<string, string | Buffer> {
    return this.files;
  }
}
