import type { Readable } from 'node:stream';

import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

import type { FileUploadOptions } from '../utils/validate-file-upload-options.js';

import { validateFileUploadOptions } from '../utils/validate-file-upload-options.js';

/**
 * Uploads a file to storage directly from the server.
 *
 * @param contents - The file contents as a Buffer or Readable stream
 * @param options - The file upload options (filename, size, contentType, category)
 * @param context - The service context with auth information
 * @returns The uploaded file record
 */
export async function uploadFile(
  contents: Buffer | Readable,
  options: FileUploadOptions,
  context: ServiceContext,
): Promise</* TPL_FILE_MODEL_TYPE:START */ File /* TPL_FILE_MODEL_TYPE:END */> {
  const { fileCreateInput, adapter } = await validateFileUploadOptions(
    options,
    context,
  );

  // Create the record as a pending upload first (size unknown until the upload
  // completes — a Readable has no .length). If the upload or the follow-up
  // update fails, the row is left as a pending upload and reclaimed by the
  // cleanUnusedFiles job, so no orphaned storage object is leaked.
  const file =
    await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
      .create({
        data: {
          ...fileCreateInput,
          pendingUpload: true,
          size: null,
        },
      });

  // Upload and record the actual byte size for both Buffers and streams.
  const { size } = await adapter.uploadFile(file.storagePath, contents, {
    contentType: options.contentType,
  });

  return /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
    .update({
      where: { id: file.id },
      data: {
        pendingUpload: false,
        size,
      },
    });
}
