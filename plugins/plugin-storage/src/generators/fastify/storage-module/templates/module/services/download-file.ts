// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';
import type { File } from '@prisma/client';
import type { Readable } from 'node:stream';

import { ForbiddenError } from '%errorHandlerServiceImports';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { getCategoryByNameOrThrow } from '../config/categories.config.js';

/**
 * Downloads a file from storage
 * @param fileIdOrFile - The file ID or file object
 * @param context - The service context
 * @returns The file contents as a stream
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

  const category = getCategoryByNameOrThrow(file.category);

  const isAuthorizedToRead =
    context.auth.roles.includes('system') ||
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

  return adapter.downloadFile(file.storagePath);
}
