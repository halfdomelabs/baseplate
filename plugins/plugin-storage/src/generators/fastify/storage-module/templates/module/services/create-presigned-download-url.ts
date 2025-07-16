// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { STORAGE_ADAPTERS } from '$configAdapters';
import { getCategoryByNameOrThrow } from '$configCategories';
import { ForbiddenError } from '%errorHandlerServiceImports';

interface CreatePresignedDownloadUrlInput {
  fileId: string;
}

interface CreatePresignedDownloadUrlPayload {
  url: string;
}

export async function createPresignedDownloadUrl(
  { fileId }: CreatePresignedDownloadUrlInput,
  context: ServiceContext,
): Promise<CreatePresignedDownloadUrlPayload> {
  const file = await TPL_FILE_MODEL.findUniqueOrThrow({
    where: { id: fileId },
  });

  const category = getCategoryByNameOrThrow(file.category);

  const isAuthorizedToRead =
    !category.authorize?.presignedRead ||
    (await category.authorize.presignedRead(file, context));

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  if (!(file.adapter in STORAGE_ADAPTERS)) {
    throw new Error(`Unknown storage adapter: ${file.adapter}`);
  }
  const adapter =
    STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];

  if (!adapter.createPresignedDownloadUrl) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support download URLs`,
    );
  }

  const url = await adapter.createPresignedDownloadUrl(file.storagePath);

  return { url };
}
