import type { Prisma } from '@src/generated/prisma/client.js';

import type { FileCategory } from '../types/file-category.js';

/** Helper constants for common file size constraints */
export const FileSize = {
  KB: (n: number) => n * 1024,
  MB: (n: number) => n * 1024 * 1024,
  GB: (n: number) => n * 1024 * 1024 * 1024,
} as const;

/** Helper constants for common MIME types */
export const MimeTypes = {
  images: ['image/jpeg', 'image/png', 'image/webp'],
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
} as const;

/**
 * Creates and validates a file category configuration.
 *
 * @param config - The file category configuration
 * @returns The validated file category configuration
 */
export function createFileCategory<
  TName extends string,
  TReferencedByRelation extends keyof Prisma.FileCountOutputType =
    keyof Prisma.FileCountOutputType,
>(
  config: FileCategory<TName, TReferencedByRelation>,
): FileCategory<TName, TReferencedByRelation> {
  if (!/^[A-Z][A-Z0-9_]*$/.test(config.name)) {
    throw new Error(
      'File category name must be CONSTANT_CASE (e.g., USER_AVATAR, POST_IMAGE)',
    );
  }

  if (config.maxFileSize <= 0) {
    throw new Error('Max file size must be positive');
  }

  if (
    (!config.referencedByRelations || config.referencedByRelations.length === 0) &&
    !config.disableAutoCleanup
  ) {
    throw new Error(
      `File category "${config.name}" has no referenced relations and must set disableAutoCleanup: true`,
    );
  }

  return config;
}
