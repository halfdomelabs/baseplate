import EventEmitter from 'node:events';

const mockFsWatchers = new Set<MockFSWatcher>();

// eslint-disable-next-line unicorn/prefer-event-target -- chokidar uses EventEmitter
export class MockFSWatcher extends EventEmitter {
  private watchedPaths = new Set<string>();

  constructor() {
    super();
    mockFsWatchers.add(this);
  }

  // Add paths to watch
  add(paths: string | string[]): this {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    for (const path of pathArray) {
      this.watchedPaths.add(path);
    }
    return this;
  }

  // Remove paths from watch list
  unwatch(paths: string | string[]): this {
    const pathArray = Array.isArray(paths) ? paths : [paths];
    for (const path of pathArray) {
      this.watchedPaths.delete(path);
    }
    return this;
  }

  // Close the watcher
  close(): Promise<void> {
    this.watchedPaths.clear();
    mockFsWatchers.delete(this);
    return Promise.resolve();
  }

  // Helper methods for testing
  // Simulate file events
  simulateFileEvent(event: 'add' | 'change' | 'unlink', path: string): boolean {
    if (this.watchedPaths.has(path)) {
      this.emit(event, path);
      this.emit('all', event, path);
      return true;
    }
    return false;
  }

  // Get all watched paths as an array
  getWatchedPaths(): string[] {
    return [...this.watchedPaths];
  }
}

export function resetMockFsWatchers(): void {
  mockFsWatchers.clear();
}

export function emitMockFsWatcherEvent(
  event: 'add' | 'change' | 'unlink',
  path: string,
): void {
  for (const watcher of mockFsWatchers) {
    watcher.simulateFileEvent(event, path);
  }
}

export function getMockFsWatchedFiles(): string[] {
  return [...mockFsWatchers.values()].flatMap((watcher) =>
    watcher.getWatchedPaths(),
  );
}
