import { describe, expect, it } from 'vitest';

import { migration032WebAppPluginData } from './migration-032-web-app-plugin-data.js';

const STORAGE_PLUGIN_KEY = 'baseplate-dev_plugin-storage_storage';
const NOTIFICATIONS_PLUGIN_KEY =
  'baseplate-dev_plugin-notifications_notifications';

describe('migration032WebAppPluginData', () => {
  it('relocates includeUploadComponents: true into storage pluginData', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [{ type: 'web', includeUploadComponents: true }],
    });

    expect(result.apps?.[0]?.pluginData?.[STORAGE_PLUGIN_KEY]).toEqual({
      includeUploadComponents: true,
    });
    expect(result.apps?.[0]).not.toHaveProperty('includeUploadComponents');
  });

  it('relocates includeNotifications: true into notifications pluginData', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [{ type: 'web', includeNotifications: true }],
    });

    expect(result.apps?.[0]?.pluginData?.[NOTIFICATIONS_PLUGIN_KEY]).toEqual({
      includeNotifications: true,
    });
    expect(result.apps?.[0]).not.toHaveProperty('includeNotifications');
  });

  it('does not create pluginData when flags are false', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [
        {
          type: 'web',
          includeUploadComponents: false,
          includeNotifications: false,
        },
      ],
    });

    expect(result.apps?.[0]).not.toHaveProperty('pluginData');
    expect(result.apps?.[0]).not.toHaveProperty('includeUploadComponents');
    expect(result.apps?.[0]).not.toHaveProperty('includeNotifications');
  });

  it('drops includeAuth without relocating it', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [{ type: 'web', includeAuth: true }],
    });

    expect(result.apps?.[0]).not.toHaveProperty('includeAuth');
    expect(result.apps?.[0]).not.toHaveProperty('pluginData');
  });

  it('merges into existing pluginData and preserves other app fields', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [
        {
          type: 'web',
          devPort: 5030,
          includeUploadComponents: true,
          includeNotifications: true,
          pluginData: { 'some-other-plugin': { foo: 'bar' } },
        },
      ],
    });

    const app = result.apps?.[0];
    expect(app).toHaveProperty('devPort', 5030);
    expect(app?.pluginData).toEqual({
      'some-other-plugin': { foo: 'bar' },
      [STORAGE_PLUGIN_KEY]: { includeUploadComponents: true },
      [NOTIFICATIONS_PLUGIN_KEY]: { includeNotifications: true },
    });
  });

  it('leaves non-web apps untouched', () => {
    const result = migration032WebAppPluginData.migrate({
      apps: [{ type: 'backend', includeUploadComponents: true }],
    });

    expect(result.apps?.[0]).toEqual({
      type: 'backend',
      includeUploadComponents: true,
    });
  });

  it('handles config with no apps', () => {
    const result = migration032WebAppPluginData.migrate({});
    expect(result.apps).toEqual([]);
  });
});
