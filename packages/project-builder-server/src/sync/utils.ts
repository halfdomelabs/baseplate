import type { PackageSyncResult, PackageSyncStatus } from './sync-metadata.js';

/**
 * Get the package sync status from the sync result
 * @param result - The sync result
 * @returns The package sync status
 */
export function getPackageSyncStatusFromResult(
  result: PackageSyncResult | undefined,
): PackageSyncStatus {
  if (!result) return 'in-progress';

  if (result.wasCancelled) {
    return 'cancelled';
  }

  if (result.filesWithConflicts?.length) {
    return 'conflicts';
  }

  if (result.errors?.length) {
    return 'unknown-error';
  }

  if (result.failedCommands?.length) {
    return 'command-error';
  }

  return 'success';
}
