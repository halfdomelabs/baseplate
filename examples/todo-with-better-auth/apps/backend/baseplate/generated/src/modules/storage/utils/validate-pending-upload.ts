import type { File } from '@src/generated/prisma/client.js';
import type { PrismaTransaction } from '@src/utils/data-operations/types.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type { StorageAdapter } from '../types/adapter.js';
import type { FileCategory } from '../types/file-category.js';

import { getAdapterOrThrow } from './get-adapter.js';

/**
 * Result of validating a pending upload, containing everything needed
 * to confirm the upload within a transaction.
 */
export interface ValidatedPendingUpload {
  /** The validated file record */
  file: File;
  /** The resolved storage adapter */
  adapter: StorageAdapter;
  /** The file's actual size from storage metadata */
  size: number;
  /**
   * Call this inside a transaction to confirm the upload.
   * Sets `pendingUpload: false` and updates `size` from storage metadata.
   */
  confirmUpload: (tx: PrismaTransaction) => Promise<void>;
}

/**
 * Validates a pending file upload before confirming it.
 *
 * Performs the following checks:
 * - File exists and belongs to the current user (or caller is system role)
 * - File is still pending upload (not already confirmed and connected)
 * - File category matches the expected category
 * - File was actually uploaded to storage
 * - File size is within the category's allowed range
 *
 * Returns a `confirmUpload` callback that should be called inside your
 * transaction after creating/updating the parent entity.
 *
 * @param options - Validation options
 * @param options.fileId - The file ID to validate
 * @param options.category - The expected file category
 * @param options.context - Service context for auth checks
 * @returns Validated file info with a `confirmUpload` callback
 *
 * @example
 * ```typescript
 * const { file, confirmUpload } = await validatePendingUpload({
 *   fileId: input.avatarId,
 *   category: avatarFileCategory,
 *   context,
 * });
 *
 * await prisma.$transaction(async (tx) => {
 *   await tx.user.update({
 *     where: { id: userId },
 *     data: { avatarId: file.id },
 *   });
 *   await confirmUpload(tx);
 * });
 * ```
 */
export async function validatePendingUpload({
  fileId,
  category,
  context,
}: {
  fileId: string;
  category: FileCategory;
  context: ServiceContext;
}): Promise<ValidatedPendingUpload> {
  const isSystemUser = context.auth.roles.includes('system');
  const uploaderId = isSystemUser ? undefined : context.auth.userId;

  const file = await prisma.file.findUnique({
    where: { id: fileId, uploaderId },
  });

  if (!file) {
    throw new BadRequestError(
      `File with ID "${fileId}" not found. Please make sure the file exists and you were the original uploader.`,
    );
  }

  if (!file.pendingUpload) {
    throw new BadRequestError(
      `File "${fileId}" is already in use and cannot be referenced again. Please upload a new file.`,
    );
  }

  if (file.category !== category.name) {
    throw new BadRequestError(
      `File category mismatch: File "${fileId}" belongs to category "${file.category}" but expected "${category.name}". Please upload a file of the correct type.`,
    );
  }

  const adapter = getAdapterOrThrow(file.adapter);
  const fileMetadata = await adapter.getFileMetadata(file.storagePath);

  if (!fileMetadata) {
    throw new BadRequestError(`File "${fileId}" was not uploaded correctly.`);
  }

  return {
    file,
    adapter,
    size: fileMetadata.size,
    confirmUpload: async (tx: PrismaTransaction): Promise<void> => {
      // Defense-in-depth: verify actual file size against category limits.
      // S3 POST presigned URLs enforce content-length-range, but this
      // protects against future PUT-based adapters or misconfigured policies.
      if (fileMetadata.size > category.maxFileSize) {
        await adapter.deleteFile?.(file.storagePath);
        throw new BadRequestError(
          `File "${fileId}" exceeds maximum allowed size of ${category.maxFileSize} bytes (actual: ${fileMetadata.size} bytes).`,
        );
      }
      if (category.minFileSize && fileMetadata.size < category.minFileSize) {
        await adapter.deleteFile?.(file.storagePath);
        throw new BadRequestError(
          `File "${fileId}" is below minimum required size of ${category.minFileSize} bytes (actual: ${fileMetadata.size} bytes).`,
        );
      }

      await tx.file.update({
        where: { id: fileId, pendingUpload: true },
        data: { pendingUpload: false, size: fileMetadata.size },
      });
    },
  };
}
