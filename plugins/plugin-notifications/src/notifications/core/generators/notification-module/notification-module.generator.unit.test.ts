import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createTaskTestRunner } from '@baseplate-dev/sync';
import { describe, expect, it } from 'vitest';

import {
  installedChannelKeys,
  notificationModuleGenerator,
} from './notification-module.generator.js';

/**
 * A capturing stand-in for the app-runtime config provider: records what the
 * generator registers so the test can inspect the construction entry.
 */
interface ConstructionEntry {
  dependencies?: string[];
  fragment: TsCodeFragment;
}

function createAppRuntimeConfigStub(): {
  services: Map<string, unknown>;
  flattenedModuleFields: Map<string, string>;
  construction: Map<string, ConstructionEntry>;
} {
  return {
    services: new Map(),
    flattenedModuleFields: new Map(),
    construction: new Map(),
  };
}

/** Paths the appRuntimeConfig task reads (only the service paths it references). */
const PATHS_STUB = {
  servicesNotificationService:
    '@/src/modules/notifications/services/notification.service.ts',
  servicesNotificationEvents:
    '@/src/modules/notifications/services/notification-events.ts',
  servicesInAppChannel:
    '@/src/modules/notifications/services/in-app-channel.ts',
  servicesEmailChannel: '@/src/modules/notifications/services/email-channel.ts',
} as unknown as Parameters<
  ReturnType<
    typeof notificationModuleGenerator
  >['tasks']['appRuntimeConfig']['run']
>[0]['paths'];

async function runAppRuntimeConfig(includeEmailChannel: boolean): Promise<{
  dependencies: string[];
  fragmentContents: string;
}> {
  const bundle = notificationModuleGenerator({ includeEmailChannel });
  const appRuntimeConfig = createAppRuntimeConfigStub();

  const runner = createTaskTestRunner(bundle.tasks.appRuntimeConfig);
  await runner.run({
    appRuntimeConfig: appRuntimeConfig as never,
    paths: PATHS_STUB,
  });

  const entry = appRuntimeConfig.construction.get('notification');
  if (!entry) {
    throw new Error('notification construction entry was not registered');
  }
  return {
    dependencies: entry.dependencies ?? [],
    fragmentContents: entry.fragment.contents,
  };
}

describe('installedChannelKeys', () => {
  // Both the runtime registry and the generated NotificationChannels interface
  // render from this list, so locking it here locks both against drift.
  it('includes only in-app when the email channel is disabled', () => {
    expect(installedChannelKeys(false)).toEqual(['inApp']);
  });

  it('adds email when the email channel is enabled', () => {
    expect(installedChannelKeys(true)).toEqual(['inApp', 'email']);
  });
});

describe('notificationModuleGenerator channel wiring', () => {
  it('declares the emails dependency and assembles both channels when enabled', async () => {
    const { dependencies, fragmentContents } = await runAppRuntimeConfig(true);

    expect(dependencies).toContain('pubsub');
    expect(dependencies).toContain('email');
    expect(fragmentContents).toContain('inApp');
    expect(fragmentContents).toContain('email');
    expect(fragmentContents).toContain('createEmailChannel');
  });

  it('omits the emails dependency and the email channel when disabled', async () => {
    const { dependencies, fragmentContents } = await runAppRuntimeConfig(false);

    expect(dependencies).toEqual(['pubsub']);
    expect(fragmentContents).toContain('inApp');
    expect(fragmentContents).not.toContain('email');
    expect(fragmentContents).not.toContain('createEmailChannel');
  });
});
