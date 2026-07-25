import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

/**
 * Gets a permanent public URL for a file.
 *
 * @param fileIdOrFile - The file ID or file object
 * @param context - The service context
 * @returns The public URL or undefined if not publicly accessible
 * @throws {Error} If the storage adapter is unknown or doesn't support public URLs
 */
export async function getPublicUrl(
  fileIdOrFile: string | File,
  context: ServiceContext,
): Promise<string | undefined> {
  const file =
    typeof fileIdOrFile === 'string'
      ? await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
          .findUniqueOrThrow({
            where: { id: fileIdOrFile },
          })
      : fileIdOrFile;

  const adapter = context.services.storage.getAdapterOrThrow(file.adapter);

  if (!adapter.getPublicUrl) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support public URLs`,
    );
  }

  return adapter.getPublicUrl(file.storagePath);
}
