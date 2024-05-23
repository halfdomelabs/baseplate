/**
 * Error thrown when the initialization process fails.
 */
export class InitializeServerError extends Error {
  constructor(
    message: string,
    public helpMessage?: string,
  ) {
    super(message);
    this.name = 'InitializeServerError';
  }
}

export function formatError(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
