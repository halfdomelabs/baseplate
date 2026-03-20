import { z } from 'zod';

import type { Transformer } from '@src/utils/data-operations/transformer-types.js';

import { defineTransformer } from '@src/utils/data-operations/define-transformer.js';

import type { FileCategory } from '../types/file-category.js';

import { validatePendingUpload } from '../utils/validate-pending-upload.js';

/**
 * Zod schema for file input — accepts a file ID
 */
export const fileInputSchema = z.object({
  id: z.uuid(),
});

/**
 * Nullable variant for optional file fields
 */
export const fileNullableInputSchema = fileInputSchema.nullish();

/**
 * File input type - accepts a file ID string
 */
export type FileInput = z.infer<typeof fileInputSchema>;

/** Prisma connect output for file relations */
export interface FileConnect {
  connect: { id: string };
}

/** Prisma disconnect output for file relations */
export interface FileDisconnect {
  disconnect: true;
}

/**
 * Configuration for file transformer
 *
 * @template TFileCategory - The file category type
 * @template TOptional - Whether the file is optional (allows null/disconnect)
 */
interface FileTransformerConfig<
  TFileCategory extends FileCategory,
  TOptional extends boolean = false,
> {
  /** The category of files this transformer accepts */
  category: TFileCategory;
  /** Whether the file is optional (allows null input → disconnect) */
  optional?: TOptional;
}

/**
 * Create a required file transformer.
 *
 * - **Create**: file input is required, returns `{ connect: { id } }`
 * - **Update**: file input is required, skips validation if unchanged
 *
 * @param config - Configuration with file category
 * @returns A `Transformer` for required file fields
 *
 * @example
 * ```typescript
 * const avatarTransformer = fileTransformer({
 *   category: avatarFileCategory,
 * });
 * ```
 */
export function fileTransformer<TFileCategory extends FileCategory>(
  config: FileTransformerConfig<TFileCategory>,
): Transformer<
  FileInput,
  [],
  [existing: string | null],
  FileConnect,
  FileConnect | undefined
>;

/**
 * Create an optional file transformer.
 *
 * - **Create**: file input can be null/undefined (no file attached)
 * - **Update**: null disconnects the file, undefined means no change
 *
 * @param config - Configuration with file category and `optional: true`
 * @returns A `Transformer` for optional file fields
 *
 * @example
 * ```typescript
 * const coverPhotoTransformer = fileTransformer({
 *   category: coverPhotoFileCategory,
 *   optional: true,
 * });
 * ```
 */
export function fileTransformer<TFileCategory extends FileCategory>(
  config: FileTransformerConfig<TFileCategory, true>,
): Transformer<
  FileInput | null | undefined,
  [],
  [existing: string | null],
  FileConnect | undefined,
  FileConnect | FileDisconnect | undefined
>;

export function fileTransformer<
  TFileCategory extends FileCategory,
  TOptional extends boolean,
>(
  config: FileTransformerConfig<TFileCategory, TOptional>,
): Transformer<
  FileInput | null | undefined,
  [],
  [existing: string | null],
  FileConnect | undefined,
  FileConnect | FileDisconnect | undefined
> {
  return defineTransformer<
    FileInput | null | undefined,
    [],
    [existing: string | null],
    FileConnect | undefined,
    FileConnect | FileDisconnect | undefined
  >({
    async processInput(value, context, ctx) {
      // Handle null — disconnect the file (update only, optional files only)
      if (value === null) {
        return {
          data: {
            update: { disconnect: true },
          },
        };
      }

      // Handle undefined — no change
      if (value === undefined) {
        return {};
      }

      // On update, skip validation if the file ID hasn't changed
      if (context.type === 'update') {
        const [existingFileId] = context.args;
        if (existingFileId === value.id) {
          const connect: FileConnect = { connect: { id: value.id } };
          return { data: { create: connect, update: connect } };
        }
      }

      // Validate the file and get a transaction callback to confirm the upload
      const { confirmUpload } = await validatePendingUpload({
        fileId: value.id,
        category: config.category,
        context: ctx.serviceContext,
      });

      const connect: FileConnect = { connect: { id: value.id } };
      return {
        data: { create: connect, update: connect },
        afterExecute: [
          async ({ tx }) => {
            await confirmUpload(tx);
          },
        ],
      };
    },
  });
}
