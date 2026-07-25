import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { describe, expect, it } from 'vitest';

import type {
  AppRuntimeConstructionEntry,
  AppRuntimeFieldEntry,
} from './app-runtime.generator.js';

import {
  sortConstructionEntries,
  validateConstructionBindings,
} from './app-runtime.generator.js';

function buildConstruction(
  entries: Record<string, Omit<AppRuntimeConstructionEntry, 'fragment'>>,
): Map<string, AppRuntimeConstructionEntry> {
  return new Map(
    Object.entries(entries).map(([key, entry]) => [
      key,
      { ...entry, fragment: tsCodeFragment(`const ${key} = build();`) },
    ]),
  );
}

function sortedKeys(
  entries: Record<string, Omit<AppRuntimeConstructionEntry, 'fragment'>>,
  providedNames: string[] = [],
): string[] {
  return sortConstructionEntries(
    buildConstruction(entries),
    new Set(providedNames),
  ).map(([key]) => key);
}

describe('sortConstructionEntries', () => {
  it('orders each entry after everything it depends on', () => {
    const keys = sortedKeys({
      userSession: { dependencies: ['betterAuth'] },
      betterAuth: { dependencies: ['emails'] },
      emails: { dependencies: ['queues'] },
      queues: {},
    });

    expect(keys).toEqual(['queues', 'emails', 'betterAuth', 'userSession']);
  });

  it('breaks ties by orderPriority, then key, so output is stable', () => {
    const keys = sortedKeys({
      storage: {},
      redis: { orderPriority: 'FIRST' },
      stripe: {},
      emailTransport: {},
    });

    expect(keys).toEqual(['redis', 'emailTransport', 'storage', 'stripe']);
  });

  it('lets a late-ready entry still compete on priority', () => {
    // `last` only becomes ready once `first` is emitted, but outranks the
    // independent `middle` on priority once it does.
    const keys = sortedKeys({
      middle: {},
      first: { orderPriority: 'FIRST' },
      last: { dependencies: ['first'], orderPriority: 'FIRST' },
    });

    expect(keys).toEqual(['first', 'last', 'middle']);
  });

  it('treats names bound before construction as already satisfied', () => {
    const keys = sortedKeys(
      { storage: { dependencies: ['storageCategories'] } },
      ['storageCategories'],
    );

    expect(keys).toEqual(['storage']);
  });

  it('throws naming the slice and the dependency no slice registers', () => {
    expect(() =>
      sortedKeys({ notifications: { dependencies: ['pubsub'] } }),
    ).toThrow(
      /slice 'notifications' depends on 'pubsub', which no slice registers/,
    );
  });

  it('throws naming the slices in a circular dependency', () => {
    expect(() =>
      sortedKeys({
        emails: { dependencies: ['betterAuth'] },
        betterAuth: { dependencies: ['emails'] },
        queues: {},
      }),
    ).toThrow(/circular construction dependency: .*betterAuth.*emails/);
  });
});

function validate({
  services = [],
  construction = [],
  runtimeFields = [],
  flattenedModuleFields = [],
}: {
  services?: string[];
  construction?: string[];
  runtimeFields?: string[];
  flattenedModuleFields?: [string, string][];
}): void {
  validateConstructionBindings({
    services: new Map(services.map((key) => [key, tsCodeFragment(key)])),
    construction: new Map(
      construction.map((key): [string, AppRuntimeConstructionEntry] => [
        key,
        { fragment: tsCodeFragment(`const ${key} = build();`) },
      ]),
    ),
    runtimeFields: new Map(
      runtimeFields.map((key): [string, AppRuntimeFieldEntry] => [
        key,
        { type: tsCodeFragment('unknown') },
      ]),
    ),
    flattenedModuleFields: new Map(flattenedModuleFields),
  });
}

describe('validateConstructionBindings', () => {
  it('accepts fields backed by a construction entry', () => {
    expect(() => {
      validate({
        services: ['emails', 'queues'],
        construction: ['emails', 'queues'],
        runtimeFields: ['queues'],
      });
    }).not.toThrow();
  });

  it('accepts a field bound by a flattened module binding', () => {
    expect(() => {
      validate({
        services: ['storageCategories'],
        flattenedModuleFields: [['storageCategories', 'storageCategories']],
      });
    }).not.toThrow();
  });

  it('throws naming a service with no construction entry', () => {
    expect(() => {
      validate({ services: ['emails', 'storage'], construction: ['emails'] });
    }).toThrow(
      /declares 'storage' but no slice registers a construction entry/,
    );
  });

  it('throws naming a runtime field with no construction entry', () => {
    expect(() => {
      validate({ runtimeFields: ['redis'] });
    }).toThrow(/declares 'redis' but no slice registers a construction entry/);
  });

  it('reports every unconstructed field at once, sorted', () => {
    expect(() => {
      validate({ services: ['stripe', 'redis'] });
    }).toThrow(/declares 'redis', 'stripe' but no slice registers/);
  });

  it('throws when a construction key collides with a flattened binding', () => {
    expect(() => {
      validate({
        services: ['queues'],
        construction: ['queues'],
        flattenedModuleFields: [['queues', 'queues']],
      });
    }).toThrow(
      /construction 'queues' collides with a flattened module binding/,
    );
  });

  it('accepts a flattened binding renamed away from its construction key', () => {
    expect(() => {
      validate({
        services: ['queues'],
        construction: ['queues'],
        flattenedModuleFields: [['queues', 'queueBindings']],
      });
    }).not.toThrow();
  });
});
