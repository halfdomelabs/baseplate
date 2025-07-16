// @ts-nocheck

import type { FileUploadOptions } from '$utilsValidateFileUploadOptions';
import type { ServiceContext } from '%serviceContextImports';

import { validateFileUploadOptions } from '$utilsValidateFileUploadOptions';
import { BadRequestError } from '%errorHandlerServiceImports';

export interface CreatePresignedUploadUrlPayload {
  url: string;
  method: string;
  fields?: { name: string; value: string }[];
  expiresAt: Date;
  file: TPL_FILE_MODEL_TYPE;
}

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

  const file = await TPL_FILE_MODEL.create({ data: fileCreateInput });

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
