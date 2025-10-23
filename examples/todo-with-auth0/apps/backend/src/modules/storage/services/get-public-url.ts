import type { File } from '@src/generated/prisma/client.js';

import { prisma } from '@src/services/prisma.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';

/**
 * Gets a permanent public URL for a file
 * @param fileIdOrFile - The file ID or file object
 * @returns The public URL or undefined if not publicly accessible
 * @throws {Error} If the storage adapter is unknown or doesn't support public URLs
 */
export async function getPublicUrl(
  fileIdOrFile: string | File,
): Promise<string | undefined> {
  const file =
    typeof fileIdOrFile === 'string'
      ? await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
          .findUniqueOrThrow({
            where: { id: fileIdOrFile },
          })
      : fileIdOrFile;

  if (!(file.adapter in STORAGE_ADAPTERS)) {
    throw new Error(`Unknown storage adapter: ${file.adapter}`);
  }
  const adapter =
    STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];

  if (!adapter.getPublicUrl) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support public URLs`,
    );
  }

  return adapter.getPublicUrl(file.storagePath);
}
