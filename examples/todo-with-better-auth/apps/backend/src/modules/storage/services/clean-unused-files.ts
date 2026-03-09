import { groupBy } from 'es-toolkit';

import { logError } from '@src/services/error-logger.js';
import { logger } from '@src/services/logger.js';
import { prisma } from '@src/services/prisma.js';

import { FILE_CATEGORIES } from '../config/categories.config.js';
import { getAdapterOrThrow } from '../utils/get-adapter.js';

/** How long to keep files that were uploaded but never referenced */
const UNREFERENCED_UPLOAD_EXPIRY_TIME_MS = 1000 * 60 * 60 * 24; // 1 day
/** Maximum number of files to delete in a single operation */
const CLEAN_JOB_LIMIT = 100;

/**
 * Finds and deletes unused files from storage and the database.
 *
 * Files are considered unused if:
 * 1. They belong to a cleanup-enabled category and have no references in ANY
 *    of the known file relations (orphaned files).
 * 2. They are pending uploads older than the expiry threshold (abandoned uploads).
 *
 * Deletion is performed in two phases per adapter: storage objects are deleted
 * first, then DB records. If storage deletion fails, the error is logged and
 * DB records are preserved so they can be retried on the next run.
 *
 * @returns The number of DB file records successfully cleaned up
 */
export async function cleanUnusedFiles(): Promise<number> {
  const cutoffDate = new Date(Date.now() - UNREFERENCED_UPLOAD_EXPIRY_TIME_MS);

  const categoriesForCleanup = FILE_CATEGORIES.filter(
    (c) => !c.disableAutoCleanup,
  );

  // Collect ALL known file relations across all categories for safety.
  const allFileRelations = [
    ...new Set(FILE_CATEGORIES.flatMap((c) => c.referencedByRelations)),
  ] as string[];

  const unusedFiles = await prisma.file.findMany({
    where: {
      OR: [
        // Confirmed files no longer used by any relation (orphaned)
        ...(categoriesForCleanup.length > 0 && allFileRelations.length > 0
          ? [
              {
                AND: [
                  {
                    category: {
                      in: categoriesForCleanup.map((c) => c.name),
                    },
                  },
                  { pendingUpload: false },
                  // ALL known relations must be empty
                  ...allFileRelations.map((rel) => ({
                    [rel]: { none: {} },
                  })),
                ],
              },
            ]
          : []),
        // Pending uploads that are old enough to clean
        {
          pendingUpload: true,
          createdAt: { lt: cutoffDate },
        },
      ],
    },
    take: CLEAN_JOB_LIMIT,
  });

  if (unusedFiles.length === 0) {
    logger.info('No unused files found to clean up');
    return 0;
  }

  const unusedFilesByAdapter = groupBy(unusedFiles, (file) => file.adapter);
  let totalDeleted = 0;

  for (const [adapterName, files] of Object.entries(unusedFilesByAdapter)) {
    logger.info(
      `Found ${files.length} unused files in adapter "${adapterName}"`,
    );

    try {
      const adapter = getAdapterOrThrow(adapterName);
      // Phase 1: Delete from storage
      if (adapter.deleteFiles) {
        await adapter.deleteFiles(files.map((f) => f.storagePath));
      } else {
        logger.info(
          `Adapter "${adapterName}" does not support bulk file deletion, only cleaning database records`,
        );
      }

      // Phase 2: Delete DB records (only reached if storage deletion succeeded)
      const ids = files.map((f) => f.id);
      await prisma.file.deleteMany({ where: { id: { in: ids } } });
      totalDeleted += ids.length;
      logger.info(
        `Successfully cleaned ${ids.length} files from adapter "${adapterName}"`,
      );
    } catch (err) {
      logError(err, { adapterName, fileCount: files.length });
    }
  }

  logger.info(`Cleaned up ${totalDeleted} file records total`);
  return totalDeleted;
}
