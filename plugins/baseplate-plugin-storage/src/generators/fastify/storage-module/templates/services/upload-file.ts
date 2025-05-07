// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import { BadRequestError } from '%errorHandlerServiceImports';

import { prepareUploadData, UploadDataInput } from '../utils/upload.js';

interface UploadFileInput extends UploadDataInput {
  contents: Buffer;
}

export async function uploadFile(
  input: UploadFileInput,
  context: ServiceContext,
): Promise<TPL_FILE_MODEL_TYPE> {
  const { data, fileCategory, adapter } = await prepareUploadData(
    input,
    context,
  );

  if (!adapter.uploadFile) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support uploadFile`,
    );
  }

  const file = await TPL_FILE_MODEL.create({ data });

  await adapter.uploadFile(file.path, input.contents);

  return file;
}
