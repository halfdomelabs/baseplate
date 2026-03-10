// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { getCategoryByNameOrThrow } from '$configCategories';
import { getAdapterOrThrow } from '$utilsGetAdapter';
import { ForbiddenError } from '%errorHandlerServiceImports';

interface CreatePresignedDownloadUrlInput {
  fileId: string;
}

interface CreatePresignedDownloadUrlPayload {
  url: string;
}

/**
 * Creates a presigned download URL for a file.
 *
 * @param input - The input containing the file ID
 * @param context - The service context with auth information
 * @returns The presigned download URL payload
 */
export async function createPresignedDownloadUrl(
  { fileId }: CreatePresignedDownloadUrlInput,
  context: ServiceContext,
): Promise<CreatePresignedDownloadUrlPayload> {
  const file = await TPL_FILE_MODEL.findUniqueOrThrow({
    where: { id: fileId },
  });

  const category = getCategoryByNameOrThrow(file.category);

  const isAuthorizedToRead =
    context.auth.roles.includes('system') ||
    !category.authorize?.presignedRead ||
    (await category.authorize.presignedRead(file, context));

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  const adapter = getAdapterOrThrow(file.adapter);

  if (!adapter.createPresignedDownloadUrl) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support download URLs`,
    );
  }

  const url = await adapter.createPresignedDownloadUrl(file.storagePath);

  return { url };
}
