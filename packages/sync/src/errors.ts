export class CancelledSyncError extends Error {
  constructor(message?: string) {
    super(message ?? 'Sync cancelled');
    this.name = 'CancelledSyncError';
  }
}

/**
 * Throws a `CancelledSyncError` if the signal has been aborted.
 *
 * Callers must not use `signal.throwIfAborted()`: it throws a `DOMException`,
 * which fails the `instanceof CancelledSyncError` checks that distinguish a
 * cancelled sync from a failed one.
 *
 * @param signal - The abort signal to check.
 */
export function throwIfSyncCancelled(signal?: AbortSignal): void {
  if (signal?.aborted) throw new CancelledSyncError();
}
