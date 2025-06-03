import type { SyncMetadata } from '@baseplate-dev/project-builder-server';

import { IS_PREVIEW } from '../config.js';
import { trpc } from '../trpc.js';
import { createProjectNotFoundHandler } from './errors.js';

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

export async function getSyncMetadata(id: string): Promise<SyncMetadata> {
  if (IS_PREVIEW) {
    return {
      status: 'success',
      startedAt: new Date().toISOString(),
      packages: {
        ['app:NmEolDU3Iggt']: {
          status: 'not-synced',
          path: 'packages/admin',
          name: 'admin',
          order: 0,
        },
      },
    };
  }
  return trpc.sync.getSyncMetadata
    .query({ id })
    .catch(createProjectNotFoundHandler(id));
}

export async function cancelSync(id: string): Promise<void> {
  if (IS_PREVIEW) {
    return;
  }
  await trpc.sync.cancelSync
    .mutate({ id })
    .catch(createProjectNotFoundHandler(id));
}
