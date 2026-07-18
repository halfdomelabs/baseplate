import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  registerChannel,
  validateNotificationRegistry,
} from './notification-channel.js';
import { defineNotificationType } from './notification-registry.js';

const noopChannel = { deliver: () => Promise.resolve() };

describe('validateNotificationRegistry', () => {
  it('only checks the CURRENT version, so a retired channel does not fail startup', () => {
    registerChannel({ key: 'chan-current', ...noopChannel });

    // v1 references a channel that no longer exists; v2 (current) uses a live one.
    defineNotificationType({
      key: 'test.retired-channel',
      version: 1,
      paramsSchema: z.object({}),
      channels: ['chan-removed'],
      render: () => ({ body: 'v1' }),
    });
    defineNotificationType({
      key: 'test.retired-channel',
      version: 2,
      paramsSchema: z.object({}),
      channels: ['chan-current'],
      render: () => ({ body: 'v2' }),
    });

    // Would throw if it validated v1's dead channel.
    expect(() => {
      validateNotificationRegistry();
    }).not.toThrow();
  });

  it('throws when the current version declares an unregistered channel', () => {
    defineNotificationType({
      key: 'test.bad-channel',
      version: 1,
      paramsSchema: z.object({}),
      channels: ['chan-never-registered'],
      render: () => ({ body: 'x' }),
    });

    expect(() => {
      validateNotificationRegistry();
    }).toThrow(/chan-never-registered/);
  });
});
