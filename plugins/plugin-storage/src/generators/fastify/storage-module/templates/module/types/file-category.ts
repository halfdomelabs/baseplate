// @ts-nocheck

import type { File, Prisma } from '%prismaGeneratedImports';
import type { ServiceContext } from '%serviceContextImports';

/**
 * Configuration for a file category that specifies how files of a
 * particular type should be handled, including storage, authorization,
 * and cleanup behavior.
 *
 * A single category can be referenced by multiple model relations.
 */
export interface FileCategory<
  TName extends string = string,
  TReferencedByRelation extends keyof Prisma.FileCountOutputType =
    keyof Prisma.FileCountOutputType,
> {
  /** Name of category (must be CONSTANT_CASE) */
  readonly name: TName;

  /**
   * Path prefix for this category.
   *
   * If provided, the path will be prefixed with this value e.g. /<pathPrefix>/<random-id>/<file-name>
   *
   * If not provided, the path will be prefixed with the lowercase form of the name.
   */
  readonly pathPrefix?: string;

  /** Maximum file size in bytes */
  readonly maxFileSize: number;

  /** Minimum file size in bytes (optional) */
  readonly minFileSize?: number;

  /** Allowed MIME types */
  readonly allowedMimeTypes?: readonly string[];

  /**
   * Name of the storage adapter to use for this category, validated at
   * runtime by `StorageService.getAdapterOrThrow`. Not typed as a key of the
   * configured adapters to avoid a type dependency on the runtime service
   * (this file is a leaf, imported by every feature module's file
   * categories).
   */
  readonly adapter: string;

  /**
   * Authorization rules for this file category.
   * If not provided, all access will be denied for external users.
   * System operations will still work regardless of authorization.
   */
  readonly authorize?: {
    upload?: (context: ServiceContext) => Promise<boolean> | boolean;
    presignedRead?: (
      file: File,
      context: ServiceContext,
    ) => Promise<boolean> | boolean;
  };

  /**
   * The relations that reference this file category.
   * A file is considered orphaned only when ALL relations are empty.
   *
   * Optional — categories without relations (e.g., temporary exports, email
   * attachments) must set `disableAutoCleanup: true`.
   */
  readonly referencedByRelations?: readonly TReferencedByRelation[];

  /**
   * If true, confirmed files in this category will not be automatically
   * cleaned up when they become orphaned. Required when
   * `referencedByRelations` is empty or omitted. Useful for categories where
   * files are managed manually or should persist indefinitely.
   *
   * Only governs orphan cleanup — abandoned pending uploads are always
   * reclaimed once past the expiry threshold.
   */
  readonly disableAutoCleanup?: boolean;
}
