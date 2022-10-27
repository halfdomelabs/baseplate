// @ts-nocheck

import { Readable } from 'stream';
import { ForbiddenError } from '%http-errors';
import { ServiceContext } from '%service-context';
import { STORAGE_ADAPTERS } from '../constants/adapters';
import { FILE_CATEGORIES } from '../constants/file-categories';

export async function downloadFile(
  fileId: string,
  context: ServiceContext
): Promise<Readable> {
  const file = await FILE_MODEL.findUniqueOrThrow({
    where: { id: fileId },
  });

  const category = FILE_CATEGORIES.find((c) => c.name === file.category);
  if (!category) {
    throw new Error(`Invalid file category ${file.category}`);
  }

  const isAuthorizedToRead =
    !category.authorizeRead || (await category.authorizeRead(file, context));

  if (!isAuthorizedToRead) {
    throw new ForbiddenError('You are not authorized to read this file');
  }

  const adapter =
    STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];
  if (!adapter) {
    throw new Error(`Unknown storage adapter: ${file.adapter}`);
  }

  if (!adapter.downloadFile) {
    throw new Error(
      `Storage adapter ${file.adapter} does not support downloading`
    );
  }

  return adapter.downloadFile(file.path);
}
