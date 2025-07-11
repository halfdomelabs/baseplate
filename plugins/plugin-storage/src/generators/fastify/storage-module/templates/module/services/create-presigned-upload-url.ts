// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { BadRequestError } from '%errorHandlerServiceImports';

import type { UploadDataInput } from '../utils/upload.js';

import { prepareUploadData } from '../utils/upload.js';

type CreatePresignedUploadUrlInput = UploadDataInput;

export interface CreatePresignedUploadUrlPayload {
  url: string;
  method: string;
  fields?: { name: string; value: string }[];
  expiresAt: Date;
  file: TPL_FILE_MODEL_TYPE;
}

export async function createPresignedUploadUrl(
  input: CreatePresignedUploadUrlInput,
  context: ServiceContext,
): Promise<CreatePresignedUploadUrlPayload> {
  const { data, fileCategory, adapter } = await prepareUploadData(
    input,
    context,
  );

  if (!adapter.createPresignedUploadUrl) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support createPresignedUploadUrl`,
    );
  }

  const file = await TPL_FILE_MODEL.create({ data });

  const result = await adapter.createPresignedUploadUrl({
    path: data.path,
    contentLengthRange: [
      fileCategory.minFileSize ?? 0,
      fileCategory.maxFileSize,
    ],
    contentType: data.mimeType,
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
