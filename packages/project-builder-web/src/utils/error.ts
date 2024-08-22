import { FixRefDeletionError } from '@halfdomelabs/project-builder-lib';
import { ZodError, ZodIssue } from 'zod';

export class UserVisibleError extends Error {
  constructor(
    message: string,
    public title?: string,
  ) {
    super(message);
    this.name = 'UserVisibleError';
  }
}

export class RefDeleteError extends UserVisibleError {
  constructor(public issues: FixRefDeletionError[]) {
    super(
      `Cannot delete because of references: ${issues
        .map((i) => i.ref.path.join('.'))
        .join(', ')}`,
    );
  }
}

export class NotFoundError extends UserVisibleError {
  constructor(message = 'The item you are looking for could not be found') {
    super(message, 'Not found');
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
