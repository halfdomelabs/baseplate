// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

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
): Promise<TPL_FILE_MODEL_TYPE> {
  const { fileCreateInput, adapter } = await validateFileUploadOptions(
    options,
    context,
  );

  const file = await TPL_FILE_MODEL.create({ data: fileCreateInput });

  await adapter.uploadFile(file.storagePath, contents);

  return file;
}
