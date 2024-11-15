import type { FixRefDeletionError } from '@halfdomelabs/project-builder-lib';
import type { ZodError } from 'zod';

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
  const errorMessages = error.issues.map((issue) => {
    const { path, message } = issue;
    const fieldPath = path.join('.');
    return `${fieldPath}: ${message}`;
  });

  return errorMessages.join('; ');
}
