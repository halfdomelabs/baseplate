import type { ProjectInfo } from '@baseplate-dev/project-builder-lib';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { createTestActionContext } from '../actions/__tests__/action-test-utils.js';
import { BuilderServiceManager } from './builder-service-manager.js';

/**
 * Stands in for a real ProjectBuilderService whose close() awaits a pending
 * sync. `init()` is a no-op because the real one starts a chokidar watcher.
 * Declared inside `vi.hoisted` because `vi.mock` factories are hoisted above
 * module-level bindings.
 */
const { FakeService } = vi.hoisted(() => {
  class FakeService {
    static instances: FakeService[] = [];

    private resolveClose!: () => void;
    private readonly closed = new Promise<void>((resolve) => {
      this.resolveClose = resolve;
    });

    constructor() {
      FakeService.instances.push(this);
    }

    init(): void {
      // no-op
    }

    /** Lets a close() that is currently awaiting this service finish. */
    finishClosing(): void {
      this.resolveClose();
    }

    async close(): Promise<void> {
      await this.closed;
    }
  }
  return { FakeService };
});

vi.mock('#src/service/builder-service.js', () => ({
  ProjectBuilderService: FakeService,
}));

function createManager(): BuilderServiceManager {
  return new BuilderServiceManager({
    cliVersion: '0.0.1',
    serviceActionContext: createTestActionContext({ projects: [] }),
  });
}

function createProject(id: string): ProjectInfo {
  return {
    id,
    name: id,
    directory: `/projects/${id}`,
    baseplateDirectory: `/projects/${id}/baseplate`,
    type: 'test',
  };
}

/** Registers a project and hands back the fake standing in for its service. */
function addService(
  manager: BuilderServiceManager,
  id: string,
): InstanceType<typeof FakeService> {
  manager.addService(createProject(id));
  const service = FakeService.instances.at(-1);
  if (!service) throw new Error('Expected addService to construct a service');
  return service;
}

beforeEach(() => {
  FakeService.instances = [];
});

describe('BuilderServiceManager', () => {
  it('does not drop a service re-registered while removeAllServices is closing', async () => {
    const manager = createManager();
    const original = addService(manager, 'project-a');

    const removal = manager.removeAllServices();

    // The re-registration under the same id lands before the slow close
    // settles, exactly as it would after an abandoned test teardown.
    const replacement = addService(manager, 'project-a');
    expect(manager.getService('project-a')).toBe(replacement);

    original.finishClosing();
    await removal;

    expect(manager.getService('project-a')).toBe(replacement);
    expect(manager.getServices()).toEqual([replacement]);
  });

  it('does not drop a service re-registered while removeService is closing', async () => {
    const manager = createManager();
    const original = addService(manager, 'project-a');

    const removal = manager.removeService('project-a');
    const replacement = addService(manager, 'project-a');

    original.finishClosing();
    await removal;

    expect(manager.getService('project-a')).toBe(replacement);
  });

  it('closes every registered service when removing all of them', async () => {
    const manager = createManager();
    const first = addService(manager, 'project-a');
    const second = addService(manager, 'project-b');

    const removal = manager.removeAllServices();
    first.finishClosing();
    second.finishClosing();
    await removal;

    expect(manager.getServices()).toEqual([]);
  });

  it('throws when removing a service that is not registered', async () => {
    const manager = createManager();

    await expect(manager.removeService('missing')).rejects.toThrow(
      'Service with id missing not found',
    );
  });
});
