import type { DataPipeOutput } from '@src/utils/data-pipes.js';
import type { ServiceContext } from '@src/utils/service-context.js';

import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type { FileCategory } from '../types/file-category.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';

export interface FileUploadInput {
  id: string;
}

/**
 * Validates a file input and checks the upload is authorized
 * @param input - The file input
 * @param category - The category of the file
 * @param context - The service context
 * @param existingId - The existing ID of the file (if any)
 * @returns The data pipe output
 */
export async function validateFileInput(
  { id }: FileUploadInput,
  category: FileCategory,
  context: ServiceContext,
  existingId?: string | null,
): Promise<DataPipeOutput<{ connect: { id: string } }>> {
  // if we're updating and not changing the ID, skip checks
  if (existingId === id) {
    return { data: { connect: { id } } };
  }

  const file =
    await /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
      .findUnique({
        where: { id },
      });

  // Check if file exists
  if (!file) {
    throw new BadRequestError(`File with ID "${id}" does not exist`);
  }

  // Check authorization: must be system role or the uploader
  const isSystemUser = context.auth.roles.includes('system');
  const isUploader = file.uploaderId === context.auth.userId;

  if (!isSystemUser && !isUploader) {
    throw new BadRequestError(
      `Access denied: You can only use files that you uploaded. File "${id}" was uploaded by a different user.`,
    );
  }

  // Check if file is already referenced
  if (file.referencedAt) {
    throw new BadRequestError(
      `File "${id}" is already in use and cannot be referenced again. Please upload a new file.`,
    );
  }

  // Check category match
  if (file.category !== category.name) {
    throw new BadRequestError(
      `File category mismatch: File "${id}" belongs to category "${file.category}" but expected "${category.name}". Please upload a file of the correct type.`,
    );
  }

  // Validate file was uploaded
  const adapter =
    STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];
  const fileMetadata = await adapter.getFileMetadata(file.storagePath);
  if (!fileMetadata) {
    throw new BadRequestError(`File "${id}" was not uploaded correctly.`);
  }

  return {
    data: { connect: { id } },
    operations: {
      afterPrismaPromises: [
        /* TPL_FILE_MODEL:START */ prisma.file /* TPL_FILE_MODEL:END */
          .update({
            where: { id },
            data: {
              referencedAt: new Date(),
              size: fileMetadata.size,
            },
          }),
      ],
    },
  };
}
