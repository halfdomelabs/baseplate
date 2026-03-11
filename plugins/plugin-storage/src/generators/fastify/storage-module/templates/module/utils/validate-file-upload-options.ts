// @ts-nocheck

import type { StorageAdapter } from '$typesAdapter';
import type { FileCategory } from '$typesFileCategory';
import type { ServiceContext } from '%serviceContextImports';

import { getCategoryByNameOrThrow } from '$configCategories';
import { getAdapterOrThrow } from '$utilsGetAdapter';
import {
  getEncodingFromContentType,
  getMimeTypeFromContentType,
  InvalidMimeTypeError,
  validateFileExtensionWithMimeType,
} from '$utilsMime';
import { BadRequestError, ForbiddenError } from '%errorHandlerServiceImports';
import { nanoid } from 'nanoid';
import { z } from 'zod';

/** Maximum allowed filename length */
const MAX_FILENAME_LENGTH = 128;

/**
 * Replaces unsafe characters in filenames for S3-compatible storage paths.
 *
 * @see https://docs.aws.amazon.com/AmazonS3/latest/userguide/object-keys.html
 * @param filename - The original filename
 * @returns The sanitized filename
 */
function makeFilenameSafe(filename: string): string {
  return filename.replaceAll(/[^a-zA-Z0-9!\-_.*'()]/g, '_');
}

const fileUploadOptionsSchema = z.object({
  /** The file name */
  filename: z
    .string('File name is required and must be a string')
    .max(MAX_FILENAME_LENGTH, {
      message: `File name is too long (max ${MAX_FILENAME_LENGTH} characters)`,
    }),
  /** The file size in bytes (used for validation only, not stored for presigned uploads) */
  size: z
    .number('File size is required and must be a positive number')
    .positive('File size is required and must be a positive number'),
  /** The content type of the file */
  contentType: z.string('Content type is required').min(1),
  /** The category of the file */
  category: z.string('Category is required').min(1),
});

export type FileUploadOptions = z.infer<typeof fileUploadOptionsSchema>;

/**
 * Validates file size constraints for the category.
 *
 * @param fileCategory - The file category with size constraints
 * @param fileSize - The file size in bytes to validate
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
 * Validates mime type and file extension match.
 *
 * @param fileCategory - The file category with allowed MIME types
 * @param contentType - The content type header value
 * @param filename - The filename to validate extension for
 * @returns The extracted MIME type
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
 * Validates file upload options and returns the validated data for file creation.
 *
 * The returned `fileCreateInput` does NOT include `size` or `pendingUpload` —
 * these are set by the caller (`uploadFile` or `createPresignedUploadUrl`)
 * based on the upload method.
 *
 * @param options - The file upload options (filename, size, contentType, category)
 * @param context - The service context with auth information
 * @returns The validated file create input, file category, and storage adapter
 */
export async function validateFileUploadOptions(
  options: FileUploadOptions,
  context: ServiceContext,
): Promise<{
  fileCreateInput: TPL_FILE_CREATE_INPUT;
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

  // Validate file size constraints (validates client-claimed size for presigned URL generation)
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
  const adapter = getAdapterOrThrow(fileCategory.adapter);

  // Prepare file record data (size and pendingUpload set by caller)
  const fileCreateInput = {
    filename: cleanedFilename,
    storagePath,
    category: fileCategory.name,
    adapter: fileCategory.adapter,
    mimeType,
    encoding,
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
