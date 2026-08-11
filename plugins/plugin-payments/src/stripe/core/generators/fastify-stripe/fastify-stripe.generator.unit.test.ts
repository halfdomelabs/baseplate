import type { TsCodeFragment } from '@baseplate-dev/core-generators';
import type { BuilderAction } from '@baseplate-dev/sync';

import { createTaskTestRunner } from '@baseplate-dev/sync';
import { describe, expect, it, vi } from 'vitest';

import type { StripeFastifyStripeRenderers } from './generated/template-renderers.js';

import { fastifyStripeGenerator } from './fastify-stripe.generator.js';

interface RenderOptions {
  variables: {
    serviceEventHandlers?: {
      TPL_EVENT_HANDLERS: TsCodeFragment;
      TPL_SERVICES_PARAM: TsCodeFragment;
      TPL_SERVICES_TYPE: TsCodeFragment;
    };
  };
}

function createRenderersStub(): {
  renderers: StripeFastifyStripeRenderers;
  webhookServicesCalls: RenderOptions[];
} {
  const webhookServicesCalls: RenderOptions[] = [];
  const stubAction: BuilderAction = { execute: () => undefined };

  return {
    renderers: {
      pluginsGroup: { render: vi.fn(() => stubAction) },
      webhookServicesGroup: {
        render: vi.fn((options: RenderOptions) => {
          webhookServicesCalls.push(options);
          return stubAction;
        }),
      },
    } as unknown as StripeFastifyStripeRenderers,
    webhookServicesCalls,
  };
}

async function runMain(additionalServices: string[]): Promise<{
  servicesParam: string;
  servicesType: string;
}> {
  const bundle = fastifyStripeGenerator({});
  const { renderers, webhookServicesCalls } = createRenderersStub();

  const runner = createTaskTestRunner(bundle.tasks.main);
  await runner.run({
    renderers,
    stripeWebhookConfigValues: {
      additionalServices,
      eventHandlers: new Map(),
    } as never,
  });

  const call = webhookServicesCalls[0];
  const serviceEventHandlers = call?.variables.serviceEventHandlers;
  if (!serviceEventHandlers) {
    throw new Error('serviceEventHandlers variables were not rendered');
  }
  return {
    servicesParam: serviceEventHandlers.TPL_SERVICES_PARAM.contents,
    servicesType: serviceEventHandlers.TPL_SERVICES_TYPE.contents,
  };
}

describe('fastifyStripeGenerator main task', () => {
  it('renders an empty destructure pattern for checkout-only projects with no additional services', async () => {
    const { servicesParam, servicesType } = await runMain([]);

    expect(servicesParam).toBe('{}');
    expect(servicesType).toBe("'stripe'");
  });

  it('renders a destructure pattern for each additional service registered by other generators', async () => {
    const { servicesParam, servicesType } = await runMain(['billing']);

    expect(servicesParam).toBe('{ billing }');
    expect(servicesType).toBe("'billing' | 'stripe'");
  });
});
