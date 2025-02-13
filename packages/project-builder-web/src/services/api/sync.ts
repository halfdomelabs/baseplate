import { IS_PREVIEW } from '../config';
import { trpc } from '../trpc';
import { createProjectNotFoundHandler } from './errors';

/**
 * Starts a sync operation for a project.
 *
 * @param id - The ID of the project to sync.
 * @param payload - The payload to sync.
 */
export async function startSync(id: string): Promise<void> {
  if (IS_PREVIEW) {
    return;
  }
  await trpc.sync.startSync
    .mutate({ id })
    .catch(createProjectNotFoundHandler(id));
}
