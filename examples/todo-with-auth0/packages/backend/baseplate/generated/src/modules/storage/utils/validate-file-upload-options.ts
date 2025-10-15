import { nanoid } from 'nanoid';
import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { BadRequestError, ForbiddenError } from '@src/utils/http-errors.js';

import type { StorageAdapter } from '../types/adapter.js';
import type { FileCategory } from '../types/file-category.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { getCategoryByNameOrThrow } from '../config/categories.config.js';
import {
  getEncodingFromContentType,
  getMimeTypeFromContentType,
  InvalidMimeTypeError,
  validateFileExtensionWithMimeType,
} from './mime.js';

// Constants
const MAX_FILENAME_LENGTH = 128;

/**
 * There are a set of unsafe characters that should be replaced
 *
 * https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 *
 */
function makeFilenameSafe(filename: string): string {
  return filename.replaceAll(/[^a-zA-Z0-9!\-_.*'()]/g, '_');
}

const fileUploadOptionsSchema = z.object({
  /** The file name */
  filename: z
    .string({ required_error: 'File name is required and must be a string' })
    .max(MAX_FILENAME_LENGTH, {
      message: `File name is too long (max ${MAX_FILENAME_LENGTH} characters)`,
    }),
  /** The file size in bytes */
  size: z
    .number({
      required_error: 'File size is required and must be a positive number',
    })
    .positive({
      message: 'File size is required and must be a positive number',
    }),
  /** The content type of the file */
  contentType: z.string({ required_error: 'Content type is required' }).min(1),
  /** The category of the file */
  category: z.string({ required_error: 'Category is required' }).min(1),
});

export type FileUploadOptions = z.infer<typeof fileUploadOptionsSchema>;

/**
 * Validates file size constraints for the category
 */
function validateFileSize(fileCategory: FileCategory, fileSize: number): void {
  if (fileCategory.minFileSize && fileSize < fileCategory.minFileSize) {
    throw new BadRequestError(
      `File size ${fileSize} bytes is below minimum of ${fileCategory.minFileSize} bytes for category ${fileCategory.name}`,
      'FILE_SIZE_TOO_SMALL',
      {
        minFileSize: fileCategory.minFileSize,
      },
    );
  }

  if (fileCategory.maxFileSize && fileSize > fileCategory.maxFileSize) {
    throw new BadRequestError(
      `File size ${fileSize} bytes exceeds maximum of ${fileCategory.maxFileSize} bytes for category ${fileCategory.name}`,
      'FILE_SIZE_TOO_LARGE',
      {
        maxFileSize: fileCategory.maxFileSize,
      },
    );
  }
}

/**
 * Validates mime type and file extension
 */
function validateMimeType(
  fileCategory: FileCategory,
  contentType: string,
  filename: string,
): string {
  const mimeType = getMimeTypeFromContentType(contentType);

  // Validate file extension matches mime type
  try {
    validateFileExtensionWithMimeType(mimeType, filename);
  } catch (error) {
    if (error instanceof InvalidMimeTypeError) {
      throw new BadRequestError(error.message, 'INVALID_FILE_EXTENSION', {
        expectedFileExtensions: error.expectedFileExtensions,
      });
    }
    throw error;
  }

  // Check if mime type is allowed for this category
  if (
    fileCategory.allowedMimeTypes &&
    !fileCategory.allowedMimeTypes.includes(mimeType)
  ) {
    throw new BadRequestError(
      `File type ${mimeType} is not allowed for category ${fileCategory.name}. Allowed types: ${fileCategory.allowedMimeTypes.join(', ')}`,
      'INVALID_FILE_TYPE',
      { allowedMimeTypes: fileCategory.allowedMimeTypes },
    );
  }

  return mimeType;
}

/**
 * Validates file upload options and returns the validated data for file creation
 * @param input - The file upload options
 * @param context - The service context
 * @returns The validated data
 */
export async function validateFileUploadOptions(
  options: FileUploadOptions,
  context: ServiceContext,
): Promise<{
  fileCreateInput: /* TPL_FILE_CREATE_INPUT:START */ Prisma.FileCreateInput /* TPL_FILE_CREATE_INPUT:END */;
  fileCategory: FileCategory;
  adapter: StorageAdapter;
}> {
  const validatedOptions = fileUploadOptionsSchema.parse(options);
  const { category, contentType, filename, size } = validatedOptions;

  // Find and validate file category
  const fileCategory = getCategoryByNameOrThrow(category);

  // Only system users or users with upload permission can upload files
  if (
    !context.auth.roles.includes('system') &&
    (!fileCategory.authorize?.upload ||
      !(await Promise.resolve(fileCategory.authorize.upload(context))))
  ) {
    throw new ForbiddenError(
      `You are not authorized to upload files to category: ${fileCategory.name}`,
    );
  }

  // Validate file size constraints
  validateFileSize(fileCategory, size);

  // Validate mime type and file extension
  const mimeType = validateMimeType(fileCategory, contentType, filename);
  const encoding = getEncodingFromContentType(contentType);

  // Process and clean filename
  const cleanedFilename = makeFilenameSafe(filename);

  // Generate unique storage path
  const pathPrefix =
    fileCategory.pathPrefix ??
    fileCategory.name.toLowerCase().replaceAll('_', '-');
  const storagePath = `${pathPrefix}/${nanoid(14)}/${cleanedFilename}`;

  // Get storage adapter
  const adapter = STORAGE_ADAPTERS[fileCategory.adapter];

  // Prepare file record data
  const fileCreateInput = {
    filename: cleanedFilename,
    storagePath,
    category: fileCategory.name,
    adapter: fileCategory.adapter,
    mimeType,
    encoding,
    size,
    uploader: context.auth.userId
      ? { connect: { id: context.auth.userId } }
      : undefined,
  };

  return {
    adapter,
    fileCategory,
    fileCreateInput,
  };
}
