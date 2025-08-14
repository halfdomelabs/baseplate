import { describe, expect, it } from 'vitest';

import { migration018CrudNameFieldRef } from './migration-018-crud-name-field-ref.js';

describe('migration018CrudNameFieldRef', () => {
  it('adds nameFieldRef to CRUD section using "name" field', () => {
    const oldConfig = {
      models: [
        {
          id: 'user-model',
          name: 'User',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'name' },
              { id: 'field-3', name: 'email' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Users',
                type: 'crud',
                modelRef: 'user-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]?.nameFieldRef).toBe(
      'field-2',
    );
  });

  it('adds nameFieldRef to CRUD section using "title" field when no "name" field', () => {
    const oldConfig = {
      models: [
        {
          id: 'post-model',
          name: 'Post',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'title' },
              { id: 'field-3', name: 'content' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Posts',
                type: 'crud',
                modelRef: 'post-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]?.nameFieldRef).toBe(
      'field-2',
    );
  });

  it('adds nameFieldRef to CRUD section using "id" field when no "name" or "title" field', () => {
    const oldConfig = {
      models: [
        {
          id: 'config-model',
          name: 'Config',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'value' },
              { id: 'field-3', name: 'enabled' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Configs',
                type: 'crud',
                modelRef: 'config-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]?.nameFieldRef).toBe(
      'field-1',
    );
  });

  it('adds nameFieldRef to CRUD section using first field as fallback', () => {
    const oldConfig = {
      models: [
        {
          id: 'data-model',
          name: 'Data',
          model: {
            fields: [
              { id: 'field-1', name: 'uuid' },
              { id: 'field-2', name: 'value' },
              { id: 'field-3', name: 'timestamp' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Data',
                type: 'crud',
                modelRef: 'data-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]?.nameFieldRef).toBe(
      'field-1',
    );
  });

  it('preserves existing nameFieldRef', () => {
    const oldConfig = {
      models: [
        {
          id: 'user-model',
          name: 'User',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'name' },
              { id: 'field-3', name: 'email' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Users',
                type: 'crud',
                modelRef: 'user-model',
                nameFieldRef: 'field-3', // Already set to email
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]?.nameFieldRef).toBe(
      'field-3',
    );
  });

  it('ignores non-CRUD sections', () => {
    const oldConfig = {
      models: [
        {
          id: 'user-model',
          name: 'User',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'name' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Dashboard',
                type: 'dashboard',
              },
              {
                id: 'section-2',
                name: 'Custom',
                type: 'custom',
                modelRef: 'user-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]).not.toHaveProperty(
      'nameFieldRef',
    );
    expect(result.apps?.[0]?.adminApp?.sections?.[1]).not.toHaveProperty(
      'nameFieldRef',
    );
  });

  it('handles missing models gracefully', () => {
    const oldConfig = {
      apps: [
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: true,
            pathPrefix: '/admin',
            sections: [
              {
                id: 'section-1',
                name: 'Users',
                type: 'crud',
                modelRef: 'user-model',
              },
            ],
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]?.adminApp?.sections?.[0]).not.toHaveProperty(
      'nameFieldRef',
    );
  });

  it('handles apps without adminApp', () => {
    const oldConfig = {
      models: [
        {
          id: 'user-model',
          name: 'User',
          model: {
            fields: [
              { id: 'field-1', name: 'id' },
              { id: 'field-2', name: 'name' },
            ],
          },
        },
      ],
      apps: [
        {
          id: 'api-app',
          type: 'api',
          name: 'API App',
        },
        {
          id: 'web-app',
          type: 'web',
          name: 'Web App',
          adminApp: {
            enabled: false,
            pathPrefix: '/admin',
          },
        },
      ],
    };

    const result = migration018CrudNameFieldRef.migrate(oldConfig);

    expect(result.apps?.[0]).toEqual(oldConfig.apps[0]);
    expect(result.apps?.[1]).toEqual(oldConfig.apps[1]);
  });
});
