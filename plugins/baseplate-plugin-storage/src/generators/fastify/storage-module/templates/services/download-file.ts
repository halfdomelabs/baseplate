// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';
import type { File } from '@prisma/client';
import type { Readable } from 'node:stream';

import { ForbiddenError } from '%errorHandlerServiceImports';

import { STORAGE_ADAPTERS } from '../constants/adapters.js';
import { FILE_CATEGORIES } from '../constants/file-categories.js';

export async function downloadFile(
  fileIdOrFile: string | File,
  context: ServiceContext,
): Promise<Readable> {
  const file =
    typeof fileIdOrFile === 'string'
      ? await TPL_FILE_MODEL.findUniqueOrThrow({
          where: { id: fileIdOrFile },
        })
      : fileIdOrFile;

  const category = FILE_CATEGORIES.find((c) => c.name === file.category);
  if (!category) {
    throw new Error(`Invalid file category ${file.category}`);
  }

  const isAuthorizedToRead =
    !category.authorizeRead || (await category.authorizeRead(file, context));

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  if (!(file.adapter in STORAGE_ADAPTERS)) {
    throw new Error(`Unknown storage adapter: ${file.adapter}`);
  }
  const adapter =
    STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];

  if (!adapter.downloadFile) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support downloading`,
    );
  }

  return adapter.downloadFile(file.path);
}
