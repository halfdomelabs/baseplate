export class CancelledSyncError extends Error {
  constructor(message?: string) {
    super(message ?? 'Sync cancelled');
    this.name = 'CancelledSyncError';
  }
}
