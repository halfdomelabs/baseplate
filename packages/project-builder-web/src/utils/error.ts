import { ZodError, ZodIssue } from 'zod';

export class UserVisibleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserVisibleError';
  }
}

export function formatZodError(error: ZodError): string {
  const errorMessages: string[] = [];

  error.issues.forEach((issue: ZodIssue) => {
    const { path, message } = issue;
    const fieldPath = path.join('.');
    const errorMessage = `${fieldPath}: ${message}`;
    errorMessages.push(errorMessage);
  });

  return errorMessages.join('; ');
}
