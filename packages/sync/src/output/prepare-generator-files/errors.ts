export class ConflictDetectedError extends Error {
  constructor(relativePath: string) {
    super(
      `Conflict detected in ${relativePath}. Please fix the conflict and try again.`,
    );
    this.name = 'ConflictDetectedError';
  }
}

export class FormatterError extends Error {
  constructor(
    public originalError: unknown,
    public fileContents: string,
  ) {
    super(String(originalError));
    this.name = 'FormatterError';
  }
}

export class PrepareGeneratorFilesError extends Error {
  constructor(public errors: { relativePath: string; error: unknown }[]) {
    super(
      `Error preparing generator files (showing first 10): ${errors
        .slice(0, 10)
        .map(({ relativePath, error }) => `${relativePath}: ${String(error)}`)
        .join('\n')}`,
    );
    this.name = 'PrepareGeneratorFilesError';
  }
}
