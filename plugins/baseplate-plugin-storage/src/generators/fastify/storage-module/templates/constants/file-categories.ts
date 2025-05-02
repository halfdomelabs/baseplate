// @ts-nocheck

import type { ServiceContext } from '%serviceContextImports';

import type { StorageAdapterKey } from './adapters.js';

export interface FileCategory {
  name: string;
  authorizeUpload?: (context: ServiceContext) => Promise<boolean> | boolean;
  authorizeRead?: (
    file: TPL_FILE_MODEL_TYPE,
    context: ServiceContext,
  ) => Promise<boolean> | boolean;
  minFileSize?: number;
  maxFileSize: number;
  allowedMimeTypes?: string[];
  defaultAdapter: StorageAdapterKey;
  usedByRelation: keyof TPL_FILE_COUNT_OUTPUT_TYPE;
}

const MEGABYTE = 1024 * 1024;

export const FILE_CATEGORIES: FileCategory[] = TPL_FILE_CATEGORIES;
