// @ts-nocheck

import type { FileUploadOptions } from '$utilsValidateFileUploadOptions';
import type { ServiceContext } from '%serviceContextImports';

import { validateFileUploadOptions } from '$utilsValidateFileUploadOptions';

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
): Promise<TPL_FILE_MODEL_TYPE> {
  const { fileCreateInput, adapter } = await validateFileUploadOptions(
    options,
    context,
  );

  const file = await TPL_FILE_MODEL.create({
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
