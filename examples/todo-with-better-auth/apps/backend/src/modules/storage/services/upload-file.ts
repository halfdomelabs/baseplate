import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

import type { FileUploadOptions } from '../utils/validate-file-upload-options.js';

import { validateFileUploadOptions } from '../utils/validate-file-upload-options.js';

/**
 * Uploads a file to storage directly from the server.
 *
 * @param contents - The file contents as a Buffer
 * @param options - The file upload options (filename, size, contentType, category)
 * @param context - The service context with auth information
 * @returns The uploaded file record
 */
export async function uploadFile(
  contents: Buffer,
  options: FileUploadOptions,
  context: ServiceContext,
): Promise</* TPL_FILE_MODEL_TYPE:START */ File /* TPL_FILE_MODEL_TYPE:END */> {
  const { fileCreateInput, adapter } = await validateFileUploadOptions(
    options,
    context,
  );

  const file =
    await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
      .create({
        data: {
          ...fileCreateInput,
          pendingUpload: false,
          size: contents.length,
        },
      });

  await adapter.uploadFile(file.storagePath, contents, {
    contentType: options.contentType,
  });

  return file;
}
