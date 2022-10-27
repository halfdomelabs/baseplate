// @ts-nocheck

import { File } from '@prisma/client';
import { BadRequestError } from '%http-errors';
import { ServiceContext } from '%service-context';
import { AdapterPresignedUploadUrlPayload } from '../adapters';
import { prepareUploadData, UploadDataInput } from '../utils/upload';

type CreatePresignedUploadUrlInput = UploadDataInput;

export interface CreatePresignedUploadUrlPayload
  extends AdapterPresignedUploadUrlPayload {
  file: File;
}

export async function createPresignedUploadUrl(
  input: CreatePresignedUploadUrlInput,
  context: ServiceContext
): Promise<CreatePresignedUploadUrlPayload> {
  const { data, fileCategory, adapter } = await prepareUploadData(
    input,
    context
  );

  if (!adapter.createPresignedUploadUrl) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support createPresignedUploadUrl`
    );
  }

  const file = await FILE_MODEL.create({ data });

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
