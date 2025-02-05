import { isTRPCClientError } from '../trpc';

/**
 * An error that is thrown when a project is not found.
 */
export class ProjectNotFoundError extends Error {
  constructor(projectId: string) {
    super(`Project not found for project ID: ${projectId}`);
  }
}

/**
 * Creates a handler that throws a {@link ProjectNotFoundError} if the error is a TRPC client error with a NOT_FOUND code.
 *
 * @param projectId - The ID of the project that was not found.
 * @returns A handler that throws a {@link ProjectNotFoundError} if the error is a TRPC client error with a NOT_FOUND code.
 */
export function createProjectNotFoundHandler(
  projectId: string,
): (err: unknown) => never {
  return (err: unknown) => {
    if (isTRPCClientError(err) && err.data?.code === 'NOT_FOUND') {
      throw new ProjectNotFoundError(projectId);
    }
    throw err;
  };
}
