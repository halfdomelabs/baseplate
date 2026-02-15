import { describe, expect, it } from 'vitest';

import { migration023AssignAppPorts } from './migration-023-assign-app-ports.js';

describe('migration023AssignAppPorts', () => {
  it('assigns port to single backend app', () => {
    const config = {
      apps: [
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result.apps?.[0].devPort).toBe(5001); // portOffset + 1
  });

  it('assigns port to single web app', () => {
    const config = {
      apps: [
        {
          id: 'app:admin',
          type: 'web' as const,
          name: 'admin',
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result.apps?.[0].devPort).toBe(5030); // portOffset + 30
  });

  it('assigns ports to multiple web apps alphabetically', () => {
    const config = {
      apps: [
        {
          id: 'app:web',
          type: 'web' as const,
          name: 'web',
        },
        {
          id: 'app:admin',
          type: 'web' as const,
          name: 'admin',
        },
        {
          id: 'app:portal',
          type: 'web' as const,
          name: 'portal',
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    // Should be sorted alphabetically: admin, portal, web
    const adminApp = result.apps?.find((app) => app.name === 'admin');
    const portalApp = result.apps?.find((app) => app.name === 'portal');
    const webApp = result.apps?.find((app) => app.name === 'web');

    expect(adminApp?.devPort).toBe(5030); // portOffset + 30 + 0
    expect(portalApp?.devPort).toBe(5031); // portOffset + 30 + 1
    expect(webApp?.devPort).toBe(5032); // portOffset + 30 + 2
  });

  it('assigns ports to both backend and web apps', () => {
    const config = {
      apps: [
        {
          id: 'app:admin',
          type: 'web' as const,
          name: 'admin',
        },
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    const backendApp = result.apps?.find((app) => app.type === 'backend');
    const adminApp = result.apps?.find((app) => app.type === 'web');

    expect(backendApp?.devPort).toBe(5001); // portOffset + 1
    expect(adminApp?.devPort).toBe(5030); // portOffset + 30
  });

  it('preserves existing port assignments', () => {
    const config = {
      apps: [
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
          devPort: 9999, // Custom port
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result.apps?.[0].devPort).toBe(9999); // Unchanged
  });

  it('handles missing apps array', () => {
    const config = {
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result).toEqual(config);
  });

  it('handles empty apps array', () => {
    const config = {
      apps: [],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result.apps).toEqual([]);
  });

  it('preserves other app properties', () => {
    const config = {
      apps: [
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
          customProp: 'value',
          anotherProp: 123,
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect(result.apps?.[0]).toEqual({
      id: 'app:backend',
      type: 'backend',
      name: 'backend',
      customProp: 'value',
      anotherProp: 123,
      devPort: 5001,
    });
  });

  it('preserves other root properties', () => {
    const config = {
      apps: [
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
        },
      ],
      models: [{ id: 'model:user', name: 'User' }],
      settings: {
        general: {
          portOffset: 5000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model:user', name: 'User' },
    ]);
  });

  it('uses different portOffset values', () => {
    const config = {
      apps: [
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
        },
        {
          id: 'app:web',
          type: 'web' as const,
          name: 'web',
        },
      ],
      settings: {
        general: {
          portOffset: 8000,
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    const backendApp = result.apps?.find((app) => app.type === 'backend');
    const webApp = result.apps?.find((app) => app.type === 'web');

    expect(backendApp?.devPort).toBe(8001); // 8000 + 1
    expect(webApp?.devPort).toBe(8030); // 8000 + 30
  });

  it('handles complete migration scenario', () => {
    const config = {
      apps: [
        {
          id: 'app:user-portal',
          type: 'web' as const,
          name: 'user-portal',
        },
        {
          id: 'app:backend',
          type: 'backend' as const,
          name: 'backend',
        },
        {
          id: 'app:admin',
          type: 'web' as const,
          name: 'admin',
        },
      ],
      settings: {
        general: {
          portOffset: 5000,
          name: 'my-project',
        },
      },
    };

    const result = migration023AssignAppPorts.migrate(config);

    const backendApp = result.apps?.find((app) => app.type === 'backend');
    const adminApp = result.apps?.find((app) => app.name === 'admin');
    const userPortalApp = result.apps?.find(
      (app) => app.name === 'user-portal',
    );

    expect(backendApp?.devPort).toBe(5001);
    expect(adminApp?.devPort).toBe(5030); // First alphabetically
    expect(userPortalApp?.devPort).toBe(5031); // Second alphabetically
  });
});
