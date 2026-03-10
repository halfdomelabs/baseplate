// @ts-nocheck

import type { FileUploadOptions } from '$utilsValidateFileUploadOptions';
import type { ServiceContext } from '%serviceContextImports';

import { validateFileUploadOptions } from '$utilsValidateFileUploadOptions';
import { BadRequestError } from '%errorHandlerServiceImports';

/**
 * Payload returned from creating a presigned upload URL.
 */
export interface CreatePresignedUploadUrlPayload {
  /** The presigned URL to upload to */
  url: string;
  /** The HTTP method to use (POST or PUT) */
  method: string;
  /** Additional form fields required for the upload (for POST method) */
  fields?: { name: string; value: string }[];
  /** When the presigned URL expires */
  expiresAt: Date;
  /** The created file record */
  file: TPL_FILE_MODEL_TYPE;
}

/**
 * Creates a presigned upload URL for client-side file uploads.
 *
 * Creates a File record in the database with `pendingUpload: true` and `size: null`,
 * then generates a presigned URL for the client to upload directly to storage.
 * The file is confirmed when it's referenced by an entity via the `fileField` handler.
 *
 * @param input - The file upload options (filename, size, contentType, category)
 * @param context - The service context with auth information
 * @returns The presigned URL payload with upload instructions
 */
export async function createPresignedUploadUrl(
  input: FileUploadOptions,
  context: ServiceContext,
): Promise<CreatePresignedUploadUrlPayload> {
  const { fileCreateInput, fileCategory, adapter } =
    await validateFileUploadOptions(input, context);

  if (!adapter.createPresignedUploadUrl) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support createPresignedUploadUrl`,
    );
  }

  const file = await TPL_FILE_MODEL.create({
    data: {
      ...fileCreateInput,
      pendingUpload: true,
      size: null,
    },
  });

  const result = await adapter.createPresignedUploadUrl({
    path: file.storagePath,
    contentLengthRange: [
      fileCategory.minFileSize ?? 0,
      fileCategory.maxFileSize,
    ],
    contentType: input.contentType,
  });

  return {
    url: result.url,
    method: result.method,
    fields: Object.entries(result.fields).map(([name, value]) => ({
      name,
      value,
    })),
    expiresAt: result.expiresAt,
    file,
  };
}
