import type {
  DefinitionIssue,
  FixRefDeletionError,
} from '@baseplate-dev/project-builder-lib';
import type { ZodError } from 'zod';

export class UserVisibleError extends Error {
  public title?: string;

  constructor(message: string, title?: string) {
    super(message);
    this.title = title;
    this.name = 'UserVisibleError';
  }
}

export class RefDeleteError extends UserVisibleError {
  public issues: FixRefDeletionError[];

  constructor(issues: FixRefDeletionError[]) {
    super(
      `Cannot delete because of references: ${issues
        .map((i) => i.ref.path.join('.'))
        .join(', ')}`,
    );
    this.issues = issues;
  }
}

export class DefinitionIssueError extends UserVisibleError {
  public issues: DefinitionIssue[];

  constructor(issues: DefinitionIssue[]) {
    super(issues.map((i) => i.message).join('; '));
    this.issues = issues;
    this.name = 'DefinitionIssueError';
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
