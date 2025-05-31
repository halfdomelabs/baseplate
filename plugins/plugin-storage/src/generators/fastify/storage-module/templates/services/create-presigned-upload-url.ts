// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { BadRequestError } from '%errorHandlerServiceImports';

import type { AdapterPresignedUploadUrlPayload } from '../adapters/index.js';
import type { UploadDataInput } from '../utils/upload.js';

import { prepareUploadData } from '../utils/upload.js';

type CreatePresignedUploadUrlInput = UploadDataInput;

export interface CreatePresignedUploadUrlPayload
  extends AdapterPresignedUploadUrlPayload {
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
    minFileSize: fileCategory.minFileSize,
    maxFileSize: fileCategory.maxFileSize,
    contentType: data.mimeType,
  });

  return {
    ...result,
    file,
  };
}
