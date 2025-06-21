/**
 * Error thrown when a conflict is detected in the generator output
 */
export class ConflictDetectedError extends Error {
  constructor(relativePath: string) {
    super(
      `Conflict detected in ${relativePath}. Please fix the conflict and try again.`,
    );
    this.name = 'ConflictDetectedError';
  }
}

/**
 * Error thrown when there is an error formatting the generator output
 */
export class FormatterError extends Error {
  constructor(
    public cause: unknown,
    public fileContents: string,
    public outputRelativePath: string,
  ) {
    super(`Error formatting ${outputRelativePath}: ${String(cause)}`);
    this.name = 'FormatterError';
  }
}

/**
 * Error thrown when there is an error preparing the generator files
 */
export class PrepareGeneratorFilesError extends Error {
  constructor(public causes: { relativePath: string; cause: unknown }[]) {
    super(
      `Error preparing generator files (showing first 10): ${causes
        .slice(0, 10)
        .map(({ relativePath, cause }) => `${relativePath}: ${String(cause)}`)
        .join('\n')}`,
    );
    this.name = 'PrepareGeneratorFilesError';
  }
}
