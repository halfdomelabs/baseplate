// @ts-nocheck

import type { FileCategory } from '$typesFileCategory';
import type { FieldDefinition } from '%dataUtilsImports';
import type { Prisma } from '%prismaGeneratedImports';

import { validatePendingUpload } from '$utilsValidatePendingUpload';
import { BadRequestError } from '%errorHandlerServiceImports';
import { z } from 'zod';

const fileInputSchema = z.object({
  id: z.uuid(),
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
  fileIdFieldName: keyof Prisma.$FilePayload['objects'][NonNullable<
    TFileCategory['referencedByRelations']
  >[number]][number]['scalars'] &
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
 * - The file is still pending upload (not already confirmed and connected)
 * - The file category matches what's expected
 * - The file was successfully uploaded
 *
 * After validation, it confirms the upload and returns a Prisma connect object.
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

      // Validate the file input and get a transaction callback to confirm the upload
      const { confirmUpload } = await validatePendingUpload({
        fileId: value.id,
        category: config.category,
        context: serviceContext,
      });

      return {
        data: {
          create: { connect: { id: value.id } },
          update: { connect: { id: value.id } },
        },
        hooks: {
          afterExecute: [
            async ({ tx }) => {
              await confirmUpload(tx);
            },
          ],
        },
      };
    },
  };
}
