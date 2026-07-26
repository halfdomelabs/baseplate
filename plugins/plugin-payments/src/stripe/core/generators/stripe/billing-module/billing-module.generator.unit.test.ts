import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { createTaskTestRunner } from '@baseplate-dev/sync';
import { describe, expect, it } from 'vitest';

import { billingModuleGenerator } from './billing-module.generator.js';

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

/** A capturing stand-in for the stripe-webhook config provider. */
function createStripeWebhookConfigStub(): {
  eventHandlers: Map<string, TsCodeFragment>;
  additionalServices: string[];
} {
  return {
    eventHandlers: new Map(),
    additionalServices: {
      push: (...items: string[]): void => {
        additionalServicesArray.push(...items);
      },
    } as unknown as string[],
  };
}

let additionalServicesArray: string[] = [];

/** Paths the appRuntimeConfig/webhookHandlers tasks read. */
const PATHS_STUB = {
  billingService: '@/src/modules/billing/services/billing.service.js',
} as unknown as Parameters<
  ReturnType<typeof billingModuleGenerator>['tasks']['appRuntimeConfig']['run']
>[0]['paths'];

const PLANS = [
  { key: 'pro-plan', displayName: 'Pro Plan', grantedRoles: ['pro-user'] },
];

async function runAppRuntimeConfig(): Promise<{
  dependencies: string[];
  fragmentContents: string;
}> {
  const bundle = billingModuleGenerator({ plans: PLANS });
  const appRuntimeConfig = createAppRuntimeConfigStub();

  const runner = createTaskTestRunner(bundle.tasks.appRuntimeConfig);
  await runner.run({
    appRuntimeConfig: appRuntimeConfig as never,
    paths: PATHS_STUB,
  });

  const entry = appRuntimeConfig.construction.get('billing');
  if (!entry) {
    throw new Error('billing construction entry was not registered');
  }
  return {
    dependencies: entry.dependencies ?? [],
    fragmentContents: entry.fragment.contents,
  };
}

async function runWebhookHandlers(): Promise<{
  additionalServices: string[];
  fragmentContents: string;
}> {
  additionalServicesArray = [];
  const bundle = billingModuleGenerator({ plans: PLANS });
  const stripeWebhookConfig = createStripeWebhookConfigStub();

  const runner = createTaskTestRunner(bundle.tasks.webhookHandlers);
  await runner.run({
    stripeWebhookConfig: stripeWebhookConfig as never,
  });

  const entry = stripeWebhookConfig.eventHandlers.get(
    'customer.subscription.created',
  );
  if (!entry) {
    throw new Error('customer.subscription.created handler was not registered');
  }
  return {
    additionalServices: additionalServicesArray,
    fragmentContents: entry.contents,
  };
}

describe('billingModuleGenerator appRuntimeConfig wiring', () => {
  it('registers a billing construction entry depending on stripe', async () => {
    const { dependencies, fragmentContents } = await runAppRuntimeConfig();

    expect(dependencies).toEqual(['stripe']);
    expect(fragmentContents).toContain('createBillingService');
    expect(fragmentContents).toContain('stripe');
  });
});

describe('billingModuleGenerator webhook handler wiring', () => {
  it('registers subscription event handlers referencing billing, not the free functions', async () => {
    const { fragmentContents } = await runWebhookHandlers();

    expect(fragmentContents).toContain('billing.handleSubscriptionEvent');
    expect(fragmentContents).not.toContain('handleSubscriptionEvent(stripe');
  });

  it('declares billing as an additional service the webhook plugin must Pick', async () => {
    const { additionalServices } = await runWebhookHandlers();

    expect(additionalServices).toEqual(['billing']);
  });
});
