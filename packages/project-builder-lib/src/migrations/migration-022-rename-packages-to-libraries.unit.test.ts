import { describe, expect, it } from 'vitest';

import { migration022RenamePackagesToLibraries } from './migration-022-rename-packages-to-libraries.js';

describe('migration022RenamePackagesToLibraries', () => {
  it('renames packages to libraries', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:shared-utils',
          type: 'library',
          name: 'shared-utils',
        },
      ],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result).not.toHaveProperty('packages');
    expect(result.libraries).toEqual([
      {
        id: 'library:shared-utils',
        type: 'library',
        name: 'shared-utils',
      },
    ]);
  });

  it('updates package IDs from package: to library:', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:my-lib',
          type: 'library',
          name: 'my-lib',
        },
        {
          id: 'package:another-lib',
          type: 'library',
          name: 'another-lib',
        },
      ],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.libraries?.[0].id).toBe('library:my-lib');
    expect(result.libraries?.[1].id).toBe('library:another-lib');
  });

  it('renames packagesFolder to librariesFolder with default libs', () => {
    const oldConfig = {
      settings: {
        monorepo: {
          appsFolder: 'apps',
          packagesFolder: 'packages',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings?.monorepo).not.toHaveProperty('packagesFolder');
    expect(result.settings?.monorepo?.librariesFolder).toBe('libs');
    expect(result.settings?.monorepo?.appsFolder).toBe('apps');
  });

  it('uses libs as default when packagesFolder is not set', () => {
    const oldConfig = {
      settings: {
        monorepo: {
          appsFolder: 'apps',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings?.monorepo?.librariesFolder).toBe('libs');
  });

  it('preserves custom packagesFolder value when not the default', () => {
    const oldConfig = {
      settings: {
        monorepo: {
          appsFolder: 'apps',
          packagesFolder: 'custom-packages',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings?.monorepo?.librariesFolder).toBe('custom-packages');
  });

  it('handles missing settings', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:test',
          type: 'library',
          name: 'test',
        },
      ],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings).toBeUndefined();
    expect(result.libraries).toHaveLength(1);
  });

  it('handles missing monorepo settings', () => {
    const oldConfig = {
      settings: {
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings?.monorepo).toBeUndefined();
    expect(
      (result.settings as { general?: { name?: string } }).general?.name,
    ).toBe('test-project');
  });

  it('handles missing packages array', () => {
    const oldConfig = {
      settings: {
        monorepo: {
          appsFolder: 'apps',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.libraries).toBeUndefined();
  });

  it('handles empty packages array', () => {
    const oldConfig = {
      packages: [],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.libraries).toEqual([]);
  });

  it('preserves other package properties', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:test',
          type: 'library',
          name: 'test',
          customProp: 'value',
          anotherProp: 123,
        },
      ],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.libraries?.[0]).toEqual({
      id: 'library:test',
      type: 'library',
      name: 'test',
      customProp: 'value',
      anotherProp: 123,
    });
  });

  it('preserves other root-level properties', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:test',
          type: 'library',
          name: 'test',
        },
      ],
      apps: [{ id: 'app-1', name: 'App' }],
      models: [{ id: 'model-1', name: 'User' }],
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect((result as { apps?: unknown }).apps).toEqual([
      { id: 'app-1', name: 'App' },
    ]);
    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
  });

  it('preserves other settings properties', () => {
    const oldConfig = {
      settings: {
        monorepo: {
          appsFolder: 'applications',
          packagesFolder: 'packages',
        },
        general: {
          name: 'test-project',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    expect(result.settings?.monorepo?.appsFolder).toBe('applications');
    expect(result.settings?.monorepo?.librariesFolder).toBe('libs');
    expect(
      (result.settings as { general?: { name?: string } }).general?.name,
    ).toBe('test-project');
  });

  it('handles complete migration scenario', () => {
    const oldConfig = {
      packages: [
        {
          id: 'package:shared-utils',
          type: 'library',
          name: 'shared-utils',
        },
        {
          id: 'package:common-types',
          type: 'library',
          name: 'common-types',
        },
      ],
      apps: [
        {
          id: 'app:backend',
          type: 'backend',
          name: 'Backend',
        },
      ],
      settings: {
        monorepo: {
          appsFolder: 'apps',
          packagesFolder: 'packages',
        },
        general: {
          name: 'my-project',
        },
      },
    };

    const result = migration022RenamePackagesToLibraries.migrate(oldConfig);

    // packages renamed to libraries
    expect(result).not.toHaveProperty('packages');
    expect(result.libraries).toHaveLength(2);

    // IDs updated
    expect(result.libraries?.[0].id).toBe('library:shared-utils');
    expect(result.libraries?.[1].id).toBe('library:common-types');

    // packagesFolder renamed to librariesFolder with new default
    expect(result.settings?.monorepo).not.toHaveProperty('packagesFolder');
    expect(result.settings?.monorepo?.librariesFolder).toBe('libs');

    // Other properties preserved
    expect((result as { apps?: unknown[] }).apps).toHaveLength(1);
  });
});
