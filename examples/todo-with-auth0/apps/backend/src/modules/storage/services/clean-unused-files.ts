import { groupBy } from 'es-toolkit';
import ms from 'ms';

import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { prisma } from '@src/services/prisma.js';

import type { StorageAdapterKey } from '../config/adapters.config.js';

import { STORAGE_ADAPTERS } from '../config/adapters.config.js';
import { FILE_CATEGORIES } from '../config/categories.config.js';

// How long to keep files that were uploaded but never referenced
const UNREFERENCED_UPLOAD_EXPIRY_TIME_MS = ms('1 day');
// Maximum number of files to delete in a single operation
const CLEAN_JOB_LIMIT = 100;

export async function cleanUnusedFiles(): Promise<number> {
  const cutoffDate = new Date(Date.now() - UNREFERENCED_UPLOAD_EXPIRY_TIME_MS);

  const unusedFiles = await prisma.file.findMany({
    where: {
      OR: [
        // Files that were referenced but are no longer used by any relations
        {
          AND: [
            {
              OR: FILE_CATEGORIES.map((category) => ({
                category: category.name,
                [category.referencedByRelation]: {
                  none: {},
                },
              })),
            },
            {
              referencedAt: { not: null },
            },
          ],
        },
        // Files that were uploaded but never referenced and are old enough to clean
        {
          referencedAt: null,
          createdAt: { lt: cutoffDate },
        },
      ],
    },
    take: CLEAN_JOB_LIMIT,
  });

  const unusedFilesByAdapter = groupBy(unusedFiles, (file) => file.adapter);

  const deletedFiles = await Promise.all(
    Object.keys(unusedFilesByAdapter).map(async (adapterName) => {
      if (!(adapterName in STORAGE_ADAPTERS)) {
        logError(
          new Error(
            `Invalid adapter name: ${adapterName}. Available adapters: ${Object.keys(STORAGE_ADAPTERS).join(', ')}`,
          ),
        );
        return [];
      }

      const adapter = STORAGE_ADAPTERS[adapterName as StorageAdapterKey];
      const unusedFilesForAdapter = unusedFilesByAdapter[adapterName];
      const paths = unusedFilesForAdapter.map((file) => file.storagePath);

      logger.info(
        `Found ${unusedFilesForAdapter.length} unused files in adapter "${adapterName}"`,
      );

      // if no deleteFiles method, assume it can be cleaned just by deleting File object
      if (!adapter.deleteFiles) {
        logger.info(
          `Adapter "${adapterName}" does not support bulk file deletion, will only clean database records`,
        );
        return unusedFilesForAdapter;
      }

      try {
        await adapter.deleteFiles(paths);
        logger.info(
          `Successfully deleted ${paths.length} files from adapter "${adapterName}"`,
        );
        return unusedFilesForAdapter;
      } catch (err) {
        logError(
          new Error(
            `Failed to delete files from adapter "${adapterName}": ${err instanceof Error ? err.message : String(err)}`,
          ),
        );
        return [];
      }
    }),
  );

  const deletedFileIds = deletedFiles.flat().map((file) => file.id);

  if (deletedFileIds.length > 0) {
    await prisma.file.deleteMany({
      where: { id: { in: deletedFileIds } },
    });
    logger.info(
      `Cleaned up ${deletedFileIds.length} file records from database`,
    );
  } else {
    logger.info('No unused files found to clean up');
  }

  return deletedFileIds.length;
}
