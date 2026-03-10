import type { Readable } from 'node:stream';

import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { ForbiddenError } from '@src/utils/http-errors.js';

import { getCategoryByNameOrThrow } from '../config/categories.config.js';
import { getAdapterOrThrow } from '../utils/get-adapter.js';

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
      ? await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
          .findUniqueOrThrow({
            where: { id: fileIdOrFile },
          })
      : fileIdOrFile;

  const category = getCategoryByNameOrThrow(file.category);

  const isAuthorizedToRead =
    context.auth.roles.includes('system') ||
    !category.authorize?.presignedRead ||
    (await category.authorize.presignedRead(file, context));

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  const adapter = getAdapterOrThrow(file.adapter);

  return adapter.downloadFile(file.storagePath);
}
