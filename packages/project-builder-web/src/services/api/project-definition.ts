import type {
  ProjectDefinitionFilePayload,
  ProjectDefinitionFileWriteResult,
} from '@halfdomelabs/project-builder-server';

import { hashWithSHA256 } from '@halfdomelabs/utils';

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
): Promise<ProjectDefinitionFilePayload> {
  if (IS_PREVIEW) {
    const response = await fetch('/preview-app.json');
    const responseText = await response.text();
    return {
      contents: responseText,
      hash: await hashWithSHA256(responseText),
    };
  }
  const response = await trpc.projects.readDefinition
    .query({ id })
    .catch(createProjectNotFoundHandler(id));
  return response.contents;
}

/**
 * Uploads a project definition file to the server, ensuring that the contents have not changed since the last read.
 *
 * @param id - The ID of the project to upload the definition for.
 * @param newContents - The new contents of the project definition file.
 * @param oldContentsHash - The SHA-256 hash of the old contents of the project definition file.
 * @returns The result of the upload operation.
 */
export async function uploadProjectDefinition(
  id: string,
  newContents: string,
  oldContentsHash: string,
): Promise<ProjectDefinitionFileWriteResult> {
  if (IS_PREVIEW) {
    return { type: 'success' };
  }
  const response = await trpc.projects.writeDefinition
    .mutate({
      id,
      newContents,
      oldContentsHash,
    })
    .catch(createProjectNotFoundHandler(id));

  return response.result;
}

/**
 * Listens for changes to the project definition file.
 *
 * @param id - The ID of the project to listen for changes for.
 * @param onData - The callback to call when a change is detected.
 * @returns A function to unsubscribe from the changes.
 */
export function listenForProjectDefinitionChanges(
  id: string,
  onData: (value: ProjectDefinitionFilePayload) => void,
): () => void {
  const result = trpc.projects.onProjectJsonChanged.subscribe(
    { id },
    { onData },
  );
  return () => {
    result.unsubscribe();
  };
}
