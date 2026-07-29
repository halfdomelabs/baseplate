// @ts-nocheck

import type { File } from '%prismaGeneratedImports';
import type { ServiceContext } from '%serviceContextImports';
import type { Readable } from 'node:stream';

import { ForbiddenError } from '%errorHandlerServiceImports';

/**
 * Downloads a file from storage.
 *
 * @param fileIdOrFile - The file ID or file object
 * @param context - The service context with auth information
 * @returns The file contents as a readable stream
 */
export async function downloadFile(
  fileIdOrFile: string | File,
  context: ServiceContext,
): Promise<Readable> {
  const file =
    typeof fileIdOrFile === 'string'
      ? await TPL_FILE_MODEL.findUniqueOrThrow({
          where: { id: fileIdOrFile },
        })
      : fileIdOrFile;

  const category = context.services.storage.getCategoryByNameOrThrow(
    file.category,
  );

  const isAuthorizedToRead =
    context.auth.hasSomeRole(['system']) ||
    ((await category.authorize?.presignedRead?.(file, context)) ?? false);

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  const adapter = context.services.storage.getAdapterOrThrow(file.adapter);

  return adapter.downloadFile(file.storagePath);
}
