// @ts-nocheck

import { BadRequestError } from '%http-errors';
import { ServiceContext } from '%service-context';
import { prepareUploadData, UploadDataInput } from '../utils/upload';

interface UploadFileInput extends UploadDataInput {
  contents: Buffer;
}

export async function uploadFile(
  input: UploadFileInput,
  context: ServiceContext
): Promise<FILE_TYPE> {
  const { data, fileCategory, adapter } = await prepareUploadData(
    input,
    context
  );

  if (!adapter.uploadFile) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support createPresignedUploadUrl`
    );
  }

  const file = await FILE_MODEL.create({ data });

  await adapter.uploadFile(file.path, input.contents);

  return file;
}
