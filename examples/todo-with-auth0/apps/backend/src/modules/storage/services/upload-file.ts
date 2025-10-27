import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';

import type { FileUploadOptions } from '../utils/validate-file-upload-options.js';

import { validateFileUploadOptions } from '../utils/validate-file-upload-options.js';

/**
 * Uploads a file to storage
 * @param contents - The file contents
 * @param options - The file upload options
 * @param context - The service context
 * @returns The uploaded file
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
      .create({ data: fileCreateInput });

  await adapter.uploadFile(file.storagePath, contents, {
    contentType: options.contentType,
  });

  return file;
}
