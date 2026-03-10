import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { ForbiddenError } from '@src/utils/http-errors.js';

import { getCategoryByNameOrThrow } from '../config/categories.config.js';
import { getAdapterOrThrow } from '../utils/get-adapter.js';

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
  const file =
    await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
      .findUniqueOrThrow({
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
