import fs from 'node:fs/promises';

/**
 * A container for files that are generated
 */
export class TemplateExtractorFileContainer {
  private files = new Map<string, string | Buffer>();

  /**
   * Writes a file to the container.
   *
   * @param filePath - The path of the file to write.
   * @param contents - The contents of the file to write.
   */
  writeFile(filePath: string, contents: string | Buffer): void {
    if (this.files.has(filePath)) {
      throw new Error(`File already written: ${filePath}`);
    }
    this.files.set(filePath, contents);
  }

  private async commitFile(
    filePath: string,
    contents: string | Buffer,
  ): Promise<void> {
    // only commit file if it has changed
    const contentsBuffer = Buffer.isBuffer(contents)
      ? contents
      : Buffer.from(contents);
    const existingContents = await fs.readFile(filePath);
    if (existingContents.equals(contentsBuffer)) {
      return;
    }
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
}
