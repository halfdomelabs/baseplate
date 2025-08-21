import type { File, Prisma } from '@prisma/client';

import type { ServiceContext } from '@src/utils/service-context.js';

import type { StorageAdapterKey } from '../config/adapters.config.js';

/**
 * Configuration for a file category that specifies how files for a
 * particular model relation to File model should be handled.
 */
export interface FileCategory<TName extends string = string> {
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

  /** Storage adapter to use for this category */
  readonly adapter: StorageAdapterKey;

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
   * The relation that references this file category.
   */
  readonly referencedByRelation: keyof /* TPL_FILE_COUNT_OUTPUT_TYPE:START */ Prisma.FileCountOutputType /* TPL_FILE_COUNT_OUTPUT_TYPE:END */;
}
