// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import type { UploadDataInput } from '../utils/upload.js';

import { prepareUploadData } from '../utils/upload.js';

interface UploadFileInput extends UploadDataInput {
  contents: Buffer;
}

export async function uploadFile(
  input: UploadFileInput,
  context: ServiceContext,
): Promise<TPL_FILE_MODEL_TYPE> {
  const { data, adapter } = await prepareUploadData(input, context);

  const file = await TPL_FILE_MODEL.create({ data });

  await adapter.uploadFile(file.path, input.contents);

  return file;
}
