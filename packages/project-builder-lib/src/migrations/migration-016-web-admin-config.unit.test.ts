import { describe, expect, it } from 'vitest';

import { migration016WebAdminConfig } from './migration-016-web-admin-config.js';

describe('migration016WebAdminConfig', () => {
  it('converts admin apps to web apps with adminApp enabled', () => {
    const oldConfig = {
      apps: [
        {
          id: 'admin-app-1',
          type: 'admin',
          name: 'My Admin App',
          sections: [
            { id: 'section-1', name: 'Users', type: 'crud' },
            { id: 'section-2', name: 'Posts', type: 'crud' },
          ],
          allowedRoles: [{ id: 'admin-role' }],
        },
      ],
    };

    const result = migration016WebAdminConfig.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'admin-app-1',
      type: 'web',
      name: 'My Admin App',
      adminApp: {
        enabled: true,
        pathPrefix: '/admin',
        sections: [
          { id: 'section-1', name: 'Users', type: 'crud' },
          { id: 'section-2', name: 'Posts', type: 'crud' },
        ],
        allowedRoles: [{ id: 'admin-role' }],
      },
    });
  });

  it('converts admin apps without sections or allowedRoles', () => {
    const oldConfig = {
      apps: [
        {
          id: 'admin-app-2',
          type: 'admin',
          name: 'Simple Admin App',
        },
      ],
    };

    const result = migration016WebAdminConfig.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'admin-app-2',
      type: 'web',
      name: 'Simple Admin App',
      adminApp: {
        enabled: true,
        pathPrefix: '/admin',
        sections: [],
        allowedRoles: undefined,
      },
    });
  });

  it('adds adminApp to web apps', () => {
    const oldConfig = {
      apps: [
        {
          id: 'web-app-1',
          type: 'web',
          name: 'My Web App',
          title: 'My App',
          description: 'A web application',
        },
        {
          id: 'api-app-1',
          type: 'api',
          name: 'My API',
        },
      ],
    };

    const result = migration016WebAdminConfig.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual({
      id: 'web-app-1',
      type: 'web',
      name: 'My Web App',
      title: 'My App',
      description: 'A web application',
      adminApp: {
        enabled: false,
        pathPrefix: '/admin',
      },
    });

    // API app should be unchanged
    expect(result.apps?.[1]).toEqual({
      id: 'api-app-1',
      type: 'api',
      name: 'My API',
    });
  });

  it('handles missing apps array gracefully', () => {
    const configWithoutApps = {};
    const result = migration016WebAdminConfig.migrate(configWithoutApps);
    expect(result).toEqual({});
  });

  it('handles empty apps array', () => {
    const configWithEmptyApps = { apps: [] };
    const result = migration016WebAdminConfig.migrate(configWithEmptyApps);
    expect(result).toEqual({ apps: [] });
  });

  it('preserves other properties', () => {
    const configWithOtherProps = {
      apps: [
        {
          id: 'web-app-1',
          type: 'web',
          name: 'My Web App',
        },
      ],
      models: [{ id: 'model-1', name: 'User' }],
      features: [{ id: 'feature-1', name: 'Auth' }],
    };

    const result = migration016WebAdminConfig.migrate(configWithOtherProps);

    expect((result as { models?: unknown }).models).toEqual([
      { id: 'model-1', name: 'User' },
    ]);
    expect((result as { features?: unknown }).features).toEqual([
      { id: 'feature-1', name: 'Auth' },
    ]);
  });

  it('does not modify web apps that already have adminApp', () => {
    const configWithExistingAdminApp = {
      apps: [
        {
          id: 'web-app-1',
          type: 'web',
          name: 'My Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/custom-admin',
            sections: [],
          },
        },
      ],
    };

    const result = migration016WebAdminConfig.migrate(
      configWithExistingAdminApp,
    );

    expect(result.apps?.[0].adminApp).toEqual({
      enabled: true,
      pathPrefix: '/custom-admin',
      sections: [],
    });
  });

  it('handles non-web apps correctly', () => {
    const configWithNonWebApps = {
      apps: [
        {
          id: 'api-app-1',
          type: 'api',
          name: 'My API',
        },
        {
          id: 'cli-app-1',
          type: 'cli',
          name: 'My CLI',
        },
      ],
    };

    const result = migration016WebAdminConfig.migrate(configWithNonWebApps);

    // Non-web apps should remain unchanged
    expect(result.apps?.[0]).toEqual({
      id: 'api-app-1',
      type: 'api',
      name: 'My API',
    });
    expect(result.apps?.[1]).toEqual({
      id: 'cli-app-1',
      type: 'cli',
      name: 'My CLI',
    });
  });
});
