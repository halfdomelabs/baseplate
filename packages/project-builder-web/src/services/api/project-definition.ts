import type {
  FilePayload,
  WriteResult,
} from '@halfdomelabs/project-builder-server';

import { IS_PREVIEW } from '../config';
import { trpc } from '../trpc';
import { createProjectNotFoundHandler } from './errors';

/**
 * Downloads a project definition file from the server.
 *
 * @param id - The ID of the project to download the definition for.
 * @returns The project definition file payload.
 */
export async function downloadProjectDefinition(
  id: string,
): Promise<FilePayload | undefined> {
  if (IS_PREVIEW) {
    const response = await fetch('/preview-app.json');
    return {
      lastModifiedAt: new Date().toISOString(),
      contents: await response.text(),
    };
  }
  const response = await trpc.projects.get
    .query({ id })
    .catch(createProjectNotFoundHandler(id));

  return response.file;
}

/**
 * Uploads a project definition file to the server.
 *
 * @param id - The ID of the project to upload the definition for.
 * @param contents - The project definition file payload.
 * @returns The result of the upload operation.
 */
export async function uploadProjectDefinition(
  id: string,
  contents: FilePayload,
): Promise<WriteResult> {
  if (IS_PREVIEW) {
    return { type: 'success', lastModifiedAt: new Date().toISOString() };
  }
  const response = await trpc.projects.writeConfig
    .mutate({
      id,
      contents: contents.contents,
      lastModifiedAt: contents.lastModifiedAt,
    })
    .catch(createProjectNotFoundHandler(id));

  return response.result;
}
