import { vol } from 'memfs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  createInitialProjectDefinition,
  generateRootPackage,
} from './project-generator.js';

vi.mock('node:fs');
vi.mock('node:fs/promises');

// Mock project-builder-lib
vi.mock('@baseplate-dev/project-builder-lib', () => ({
  getLatestMigrationVersion: vi.fn(() => 21),
}));

// Mock project-builder-server
vi.mock('@baseplate-dev/project-builder-server', () => ({
  generateProjectId: vi.fn(() => 'test-project-id'),
  syncProject: vi.fn(() =>
    Promise.resolve({
      status: 'success',
      packageSyncResults: {},
    }),
  ),
  SyncMetadataController: vi.fn().mockImplementation(() => ({
    updateMetadata: vi.fn(),
    updateMetadataForPackage: vi.fn(),
    getMetadata: vi.fn(() => Promise.resolve({ packages: {} })),
  })),
}));

// Mock sync
vi.mock('@baseplate-dev/sync', () => ({
  createConsoleLogger: vi.fn(() => ({
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  })),
}));

// Mock utils
vi.mock('@baseplate-dev/utils', () => ({
  stringifyPrettyStable: vi.fn((obj) => JSON.stringify(obj, null, 2)),
}));

describe('createInitialProjectDefinition', () => {
  it('creates a project definition with isInitialized: false', () => {
    const config = {
      name: 'test-project',
      cliVersion: '1.0.0',
      directory: '/test-dir',
    };

    const definition = createInitialProjectDefinition(config);

    expect(definition.isInitialized).toBe(false);
    expect(definition.settings.general.name).toBe('test-project');
    expect(definition.settings.general.packageScope).toBe('');
    expect(definition.settings.general.portOffset).toBe(3000);
    expect(definition.apps).toEqual([]);
    expect(definition.models).toEqual([]);
    expect(definition.features).toEqual([]);
    expect(definition.cliVersion).toBe('1.0.0');
    expect(definition.schemaVersion).toBe(21);
  });

  it('uses different names correctly', () => {
    const config = {
      name: 'my-awesome-app',
      cliVersion: '2.0.0',
      directory: '/path/to/app',
    };

    const definition = createInitialProjectDefinition(config);

    expect(definition.settings.general.name).toBe('my-awesome-app');
    expect(definition.cliVersion).toBe('2.0.0');
  });
});

describe('generateRootPackage', () => {
  beforeEach(() => {
    vol.reset();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vol.reset();
  });

  it('creates the baseplate directory and writes project definition', async () => {
    const config = {
      name: 'test-project',
      cliVersion: '1.0.0',
      directory: '/test-dir',
    };

    await generateRootPackage(config);

    // Check baseplate directory was created
    expect(vol.existsSync('/test-dir/baseplate')).toBe(true);

    // Check project-definition.json was written
    expect(vol.existsSync('/test-dir/baseplate/project-definition.json')).toBe(
      true,
    );

    const definitionContent = vol.readFileSync(
      '/test-dir/baseplate/project-definition.json',
      'utf8',
    );
    const definition = JSON.parse(definitionContent as string) as Record<
      string,
      unknown
    >;
    expect(definition).toHaveProperty('isInitialized', false);
    expect(definition).toHaveProperty('settings');
  });

  it('calls syncProject with correct options', async () => {
    const serverModule = await import('@baseplate-dev/project-builder-server');
    const { syncProject } = vi.mocked(serverModule);

    const config = {
      name: 'test-project',
      cliVersion: '1.0.0',
      directory: '/test-dir',
    };

    await generateRootPackage(config);

    expect(syncProject).toHaveBeenCalledWith(
      expect.objectContaining({
        directory: '/test-dir',
        userConfig: {},
        overwrite: true,
      }),
    );
  });

  it('throws error when syncProject fails', async () => {
    const serverModule = await import('@baseplate-dev/project-builder-server');
    const { syncProject } = vi.mocked(serverModule);

    syncProject.mockResolvedValueOnce({
      status: 'error',
      packageSyncResults: {},
    });

    const config = {
      name: 'test-project',
      cliVersion: '1.0.0',
      directory: '/test-dir',
    };

    await expect(generateRootPackage(config)).rejects.toThrow(
      'Failed to generate project files',
    );
  });

  it('handles nested directories', async () => {
    const config = {
      name: 'nested-project',
      cliVersion: '1.0.0',
      directory: '/deeply/nested/path/to/project',
    };

    await generateRootPackage(config);

    expect(vol.existsSync('/deeply/nested/path/to/project/baseplate')).toBe(
      true,
    );
    expect(
      vol.existsSync(
        '/deeply/nested/path/to/project/baseplate/project-definition.json',
      ),
    ).toBe(true);
  });

  it('creates SyncMetadataController with correct directory', async () => {
    const serverModule = await import('@baseplate-dev/project-builder-server');
    const { SyncMetadataController } = vi.mocked(serverModule);

    const config = {
      name: 'my-project',
      cliVersion: '1.0.0',
      directory: '/my-project',
    };

    await generateRootPackage(config);

    expect(SyncMetadataController).toHaveBeenCalledWith(
      '/my-project',
      expect.anything(),
    );
  });
});
