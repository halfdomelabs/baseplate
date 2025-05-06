export class WriteGeneratorFilesError extends Error {
  constructor(public errors: { relativePath: string; error: unknown }[]) {
    super(
      `Error writing generator files (showing first 10): ${errors
        .slice(0, 10)
        .map(
          ({ relativePath, error }) =>
            `${relativePath}: ${
              error instanceof Error ? error.message : String(error)
            }`,
        )
        .join('\n')}`,
    );
    this.name = 'WriteGeneratorFilesError';
  }
}
