import type { ProjectInfo } from '@baseplate-dev/project-builder-server';

import { IS_PREVIEW } from '../config.js';
import { trpc } from '../trpc.js';

/**
 * Gets all available projects from the server.
 *
 * @returns The projects.
 */
export async function getProjects(): Promise<ProjectInfo[]> {
  if (IS_PREVIEW) {
    return [
      {
        id: 'preview-project',
        name: 'Preview Project',
        directory: '~/preview-project',
        isInternalExample: false,
      },
    ];
  }
  return trpc.projects.list.query();
}
