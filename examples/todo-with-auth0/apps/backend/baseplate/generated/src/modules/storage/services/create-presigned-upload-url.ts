import type { File } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type { FileUploadOptions } from '../utils/validate-file-upload-options.js';

import { validateFileUploadOptions } from '../utils/validate-file-upload-options.js';

export interface CreatePresignedUploadUrlPayload {
  url: string;
  method: string;
  fields?: { name: string; value: string }[];
  expiresAt: Date;
  file: /* TPL_FILE_MODEL_TYPE:START */ File /* TPL_FILE_MODEL_TYPE:END */;
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

  const file =
    await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
      .create({ data: fileCreateInput });

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
