import { z } from 'zod';

import type { Prisma } from '@src/generated/prisma/client.js';
import type { FieldDefinition } from '@src/utils/data-operations/types.js';

import { prisma } from '@src/services/prisma.js';
import { BadRequestError } from '@src/utils/http-errors.js';

import type { FileCategory } from '../types/file-category.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';

const fileInputSchema = z.object({
  id: z.string().uuid(),
});

/**
 * File input type - accepts a file ID string
 */
export type FileInput = z.infer<typeof fileInputSchema>;

/**
 * Configuration for file field handler
 */
interface FileFieldConfig<
  TFileCategory extends FileCategory,
  TOptional extends boolean = false,
> {
  /**
   * The category of files this field accepts
   */
  category: TFileCategory;
  /**
   * The field name of the file ID in the existing model
   */
  fileIdFieldName: keyof Prisma.$FilePayload['objects'][TFileCategory['referencedByRelation']][number]['scalars'] &
    string;

  /**
   * Whether the file is optional
   */
  optional?: TOptional;
}

/**
 * Create a file field handler with validation and authorization
 *
 * This helper creates a field definition for managing file uploads.
 * It validates that:
 * - The file exists
 * - The user is authorized to use the file (must be uploader or system role)
 * - The file hasn't been referenced by another entity
 * - The file category matches what's expected
 * - The file was successfully uploaded
 *
 * After validation, it marks the file as referenced and returns a Prisma connect object.
 *
 * For create operations:
 * - Returns connect object if file ID is provided and valid
 * - Returns undefined if input is not provided
 *
 * For update operations:
 * - Returns connect object if file ID is provided and valid
 * - Returns disconnect if input is null (removes file reference)
 * - Returns undefined if input is not provided (no change)
 * - Skips validation if the file ID hasn't changed from existing
 *
 * @param config - Configuration object
 * @returns Field definition
 *
 * @example
 * ```typescript
 * const fields = {
 *   avatar: fileField({
 *     category: avatarFileCategory,
 *   }),
 * };
 * ```
 */
export function fileField<
  TFileCategory extends FileCategory,
  TOptional extends boolean = false,
>(
  config: FileFieldConfig<TFileCategory, TOptional>,
): FieldDefinition<
  TOptional extends true
    ? z.ZodOptional<z.ZodNullable<typeof fileInputSchema>>
    : typeof fileInputSchema,
  TOptional extends true
    ? { connect: { id: string } } | undefined
    : { connect: { id: string } },
  TOptional extends true
    ? { connect: { id: string } } | { disconnect: true } | undefined
    : { connect: { id: string } } | undefined
> {
  return {
    schema: (config.optional
      ? fileInputSchema.nullish()
      : fileInputSchema) as TOptional extends true
      ? z.ZodOptional<z.ZodNullable<typeof fileInputSchema>>
      : typeof fileInputSchema,
    processInput: async (
      value: z.infer<typeof fileInputSchema> | null | undefined,
      processCtx,
    ) => {
      const { serviceContext } = processCtx;

      // Handle null - disconnect the file
      if (value === null) {
        return {
          data: {
            create: undefined,
            update: { disconnect: true } as TOptional extends true
              ? { connect: { id: string } } | { disconnect: true } | undefined
              : { connect: { id: string } } | undefined,
          },
        };
      }

      // Handle undefined - no change
      if (value === undefined) {
        return { data: { create: undefined, update: undefined } };
      }

      // Get existing file ID to check if we're changing it
      const existingModel = (await processCtx.loadExisting()) as
        | Record<string, unknown>
        | undefined;

      if (existingModel && !(config.fileIdFieldName in existingModel)) {
        throw new BadRequestError(
          `File ID field "${config.fileIdFieldName}" not found in existing model`,
        );
      }

      const existingFileId = existingModel?.[config.fileIdFieldName];

      // If we're updating and not changing the ID, skip checks
      if (existingFileId === value.id) {
        return {
          data: {
            create: { connect: { id: value.id } },
            update: { connect: { id: value.id } },
          },
        };
      }

      // Validate the file input
      const { id } = value;
      const isSystemUser = serviceContext.auth.roles.includes('system');
      const uploaderId = isSystemUser ? undefined : serviceContext.auth.userId;
      const file = await prisma.file.findUnique({
        where: { id, uploaderId },
      });

      // Check if file exists
      if (!file) {
        throw new BadRequestError(
          `File with ID "${id}" not found. Please make sure the file exists and you were the original uploader.`,
        );
      }

      // Check if file is already referenced
      if (file.referencedAt) {
        throw new BadRequestError(
          `File "${id}" is already in use and cannot be referenced again. Please upload a new file.`,
        );
      }

      // Check category match
      if (file.category !== config.category.name) {
        throw new BadRequestError(
          `File category mismatch: File "${id}" belongs to category "${file.category}" but expected "${config.category.name}". Please upload a file of the correct type.`,
        );
      }

      // Validate file was uploaded
      if (!(file.adapter in STORAGE_ADAPTERS)) {
        throw new BadRequestError(
          `Unknown file adapter "${file.adapter}" configured for file "${id}".`,
        );
      }

      const adapter =
        STORAGE_ADAPTERS[file.adapter as keyof typeof STORAGE_ADAPTERS];

      const fileMetadata = await adapter.getFileMetadata(file.storagePath);
      if (!fileMetadata) {
        throw new BadRequestError(`File "${id}" was not uploaded correctly.`);
      }

      return {
        data: {
          create: { connect: { id } },
          update: { connect: { id } },
        },
        hooks: {
          afterExecute: [
            async ({ tx }) => {
              await tx.file.update({
                where: { id, referencedAt: null },
                data: {
                  referencedAt: new Date(),
                  size: fileMetadata.size,
                },
              });
            },
          ],
        },
      };
    },
  };
}
