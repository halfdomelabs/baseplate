// @ts-nocheck

import { Prisma } from '@prisma/client';
import { ServiceContext } from '%service-context';
import { StorageAdapterKey } from './adapters';

export interface FileCategory {
  name: string;
  authorizeUpload?: (context: ServiceContext) => Promise<boolean> | boolean;
  authorizeRead?: (
    file: FILE_MODEL_TYPE,
    context: ServiceContext,
  ) => Promise<boolean> | boolean;
  minFileSize?: number;
  maxFileSize: number;
  allowedMimeTypes?: string[];
  defaultAdapter: StorageAdapterKey;
  usedByRelation: keyof Prisma.FILE_COUNT_OUTPUT_TYPE;
}

const MEGABYTE = 1024 * 1024;

export const FILE_CATEGORIES: FileCategory[] = CATEGORIES;
