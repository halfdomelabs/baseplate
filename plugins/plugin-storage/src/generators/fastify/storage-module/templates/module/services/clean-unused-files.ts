// @ts-nocheck

import type { ServiceContextWith } from '%serviceContextImports';

import { logError } from '%errorHandlerServiceImports';
import { logger } from '%loggerServiceImports';
import { prisma } from '%prismaImports';
import { groupBy } from 'es-toolkit';

/** Grace period before an unreferenced file becomes eligible for cleanup */
const UNREFERENCED_UPLOAD_EXPIRY_TIME_MS = 1000 * 60 * 60 * 24; // 1 day
/** Maximum number of files to delete in a single operation */
const CLEAN_JOB_LIMIT = 100;

/**
 * Finds and deletes unused files from storage and the database.
 *
 * Files are considered unused if:
 * 1. They belong to a cleanup-enabled category, have no references in ANY of
 *    the known file relations, and are past the expiry threshold (orphaned).
 * 2. They are pending uploads past the expiry threshold (abandoned uploads).
 *
 * The orphan check ages on `updatedAt`, so the grace period restarts when an
 * upload is confirmed.
 *
 * Deletion is performed in two phases per adapter: storage objects are deleted
 * first, then DB records. If storage deletion fails, the error is logged and
 * DB records are preserved so they can be retried on the next run.
 *
 * @param ctx - The service context, providing access to storage adapters
 * @returns The number of DB file records successfully cleaned up
 */
export async function cleanUnusedFiles(
  ctx: ServiceContextWith<'storage'>,
): Promise<number> {
  const cutoffDate = new Date(Date.now() - UNREFERENCED_UPLOAD_EXPIRY_TIME_MS);

  const { categories } = ctx.services.storage;

  const categoriesForCleanup = categories.filter((c) => !c.disableAutoCleanup);

  // Collect ALL known file relations across all categories for safety.
  const allFileRelations = [
    ...new Set(categories.flatMap((c) => c.referencedByRelations ?? [])),
  ];

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
                  { updatedAt: { lt: cutoffDate } },
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
      const adapter = ctx.services.storage.getAdapterOrThrow(adapterName);
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
