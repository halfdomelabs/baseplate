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
  servicesNotificationRenderer:
    '@/src/modules/notifications/services/notification-renderer.ts',
  servicesEmailChannel: '@/src/modules/notifications/services/email-channel.ts',
} as unknown as Parameters<
  ReturnType<
    typeof notificationModuleGenerator
  >['tasks']['appRuntimeConfig']['run']
>[0]['paths'];

/** The parts of a construction entry these assertions care about. */
interface CapturedEntry {
  dependencies: string[];
  fragmentContents: string;
}

/**
 * Runs the runtime-config task and returns both construction entries: the
 * app-facing service and the worker-facing outbox that owns the channels.
 */
async function runAppRuntimeConfig(includeEmailChannel: boolean): Promise<{
  service: CapturedEntry;
  outbox: CapturedEntry;
  renderer: CapturedEntry;
}> {
  const bundle = notificationModuleGenerator({
    includeEmailChannel,
    userModelName: 'User',
  });
  const appRuntimeConfig = createAppRuntimeConfigStub();

  const runner = createTaskTestRunner(bundle.tasks.appRuntimeConfig);
  await runner.run({
    appRuntimeConfig: appRuntimeConfig as never,
    paths: PATHS_STUB,
  });

  function read(name: string): CapturedEntry {
    const entry = appRuntimeConfig.construction.get(name);
    if (!entry) {
      throw new Error(`${name} construction entry was not registered`);
    }
    return {
      dependencies: entry.dependencies ?? [],
      fragmentContents: entry.fragment.contents,
    };
  }

  return {
    service: read('notification'),
    outbox: read('notificationOutbox'),
    renderer: read('notificationRenderer'),
  };
}

describe('installedChannelKeys', () => {
  // Both the runtime registry and the generated NotificationChannels interface
  // render from this list, so locking it here locks both against drift.
  it('is empty when the email channel is disabled', () => {
    // In-app is deliberately absent: it is a routing flag plus a pubsub
    // publish, not a queued delivery, so it has no channel implementation.
    expect(installedChannelKeys(false)).toEqual([]);
  });

  it('adds email when the email channel is enabled', () => {
    expect(installedChannelKeys(true)).toEqual(['email']);
  });
});

describe('notificationModuleGenerator channel wiring', () => {
  it('declares the emails dependency and assembles the email channel when enabled', async () => {
    const { outbox } = await runAppRuntimeConfig(true);

    expect(outbox.dependencies).toContain('email');
    expect(outbox.fragmentContents).toContain('createEmailChannel');
  });

  it('omits the emails dependency and the email channel when disabled', async () => {
    const { outbox } = await runAppRuntimeConfig(false);

    expect(outbox.dependencies).toEqual(['queue', 'notificationRenderer']);
    expect(outbox.fragmentContents).not.toContain('email');
    expect(outbox.fragmentContents).not.toContain('createEmailChannel');
  });

  it('gives the workers the outbox and feature code the service', async () => {
    // The worker surface is reachable only through `notificationOutbox`, so
    // holding the service cannot get you `deliverChunk`.
    const { service } = await runAppRuntimeConfig(true);

    // `notificationEvents` (not `pubsub`) is the direct dependency: the events
    // emitter is its own construction entry, and it is what depends on pubsub.
    expect(service.dependencies).toEqual([
      'notificationEvents',
      'notificationRenderer',
      'notificationOutbox',
    ]);
    expect(service.fragmentContents).toContain('outbox: notificationOutbox');
    // The channels live on the outbox, so the service never sees them.
    expect(service.fragmentContents).not.toContain('channels:');
  });

  it('never registers in-app as a channel', async () => {
    // In-app is published inline by the service, so it must not appear in the
    // channel registry — a channel entry would put the badge back behind the
    // delivery worker, which is the latency this design removes.
    const withEmail = await runAppRuntimeConfig(true);
    const withoutEmail = await runAppRuntimeConfig(false);

    expect(withEmail.outbox.fragmentContents).not.toContain('inApp');
    expect(withoutEmail.outbox.fragmentContents).not.toContain('inApp');
    expect(withEmail.outbox.fragmentContents).not.toContain(
      'createInAppChannel',
    );
  });

  it('injects the queue so the outbox can hand off delivery', async () => {
    // The outbox enqueues delivery jobs, so it cannot be constructed before
    // the queue exists — the dependency is what orders the two.
    const { outbox } = await runAppRuntimeConfig(false);

    expect(outbox.dependencies).toContain('queue');
    expect(outbox.fragmentContents).toContain('queue,');
  });

  it('passes the renderer to the email channel for delivery-time rendering', async () => {
    // The email channel renders when the job runs, not when the notification is
    // written, so a copy fix reaches mail that has not gone out yet.
    const { outbox } = await runAppRuntimeConfig(true);

    expect(outbox.fragmentContents).toContain('createEmailChannel');
    expect(outbox.fragmentContents).toMatch(
      /createEmailChannel\(\{[^}]*renderer:/,
    );
  });

  it('shares one renderer between the service and the email channel', async () => {
    // Both render through the same type registry, so a second instance would
    // let the read path and the delivery path resolve a type differently.
    const { service, outbox, renderer } = await runAppRuntimeConfig(true);

    expect(renderer.fragmentContents).toContain('createNotificationRenderer');
    expect(renderer.fragmentContents).toContain('notificationTypes');
    expect(service.dependencies).toContain('notificationRenderer');
    expect(outbox.dependencies).toContain('notificationRenderer');
    // Referenced by name, never re-constructed at the use site.
    expect(service.fragmentContents).not.toContain(
      'createNotificationRenderer',
    );
    expect(outbox.fragmentContents).not.toContain('createNotificationRenderer');
  });
});
