// @ts-nocheck

import { nanoid } from 'nanoid';
import { BadRequestError, ForbiddenError } from '%http-errors';
import { ServiceContext } from '%service-context';
import { AdapterPresignedUploadUrlPayload } from '../adapters';
import { STORAGE_ADAPTERS } from '../constants/adapters';
import { FILE_CATEGORIES } from '../constants/file-categories';
import {
  getMimeTypeFromContentType,
  validateFileExtensionWithMimeType,
} from '../utils/mime';

interface CreatePresignedUploadUrlInput {
  category: string;
  contentType: string;
  fileName: string;
  fileSize: number;
}

interface CreatePresignedUploadUrlPayload
  extends AdapterPresignedUploadUrlPayload {
  file: FILE_MODEL_TYPE;
}

/**
 * There are a set of unsafe characters that should be replaced
 *
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 *
 */
function makeFileNameSafe(filename: string): string {
  return filename.replace(/[^a-zA-Z0-9!\-_.*'()]/g, '_');
}

export async function createPresignedUploadUrl(
  { category, contentType, fileName, fileSize }: CreatePresignedUploadUrlInput,
  context: ServiceContext
): Promise<CreatePresignedUploadUrlPayload> {
  const fileCategory = FILE_CATEGORIES.find((c) => c.name === category);

  if (!fileCategory) {
    throw new BadRequestError(`Invalid file category ${category}`);
  }

  if (!fileCategory.authorizeUpload || !fileCategory.authorizeUpload(context)) {
    throw new ForbiddenError(
      `You are not authorized to upload files to ${category}`
    );
  }

  if (fileCategory.minFileSize && fileSize < fileCategory.minFileSize) {
    throw new BadRequestError(
      `File size is below minimum file size of ${fileCategory.minFileSize}`
    );
  }

  if (fileCategory.maxFileSize && fileSize > fileCategory.maxFileSize) {
    throw new BadRequestError(
      `File size is above maximum file size of ${fileCategory.maxFileSize}`
    );
  }

  // mime type validation
  const mimeType = getMimeTypeFromContentType(contentType);

  validateFileExtensionWithMimeType(mimeType, fileName);

  if (
    fileCategory.allowedMimeTypes &&
    !fileCategory.allowedMimeTypes.includes(mimeType)
  ) {
    throw new BadRequestError(
      `File mime type ${mimeType} is not allowed for ${fileCategory.name}`
    );
  }

  const adapter = STORAGE_ADAPTERS[fileCategory.defaultAdapter];
  if (!adapter.createPresignedUploadUrl) {
    throw new BadRequestError(
      `Adapter for ${fileCategory.name} does not support createPresignedUploadUrl`
    );
  }

  if (fileName.length > 128) {
    throw new BadRequestError(`File name is too long`);
  }

  const cleanedFileName = makeFileNameSafe(fileName);

  const path = `${fileCategory.name}/${nanoid(14)}/${cleanedFileName}`;

  const file = await FILE_MODEL.create({
    data: {
      name: cleanedFileName,
      path,
      category: fileCategory.name,
      adapter: fileCategory.defaultAdapter,
      mimeType,
      size: fileSize,
      shouldDelete: false,
      isUsed: false,
      uploader: { connect: { id: context.auth.user?.id } },
    },
  });

  const result = await adapter.createPresignedUploadUrl({
    path: `${fileCategory.name}/${nanoid(12)}/${cleanedFileName}`,
    minFileSize: fileCategory.minFileSize,
    maxFileSize: fileCategory.maxFileSize,
    contentType,
  });

  return {
    ...result,
    file,
  };
}
