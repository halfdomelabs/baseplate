import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { describe, expect, it } from 'vitest';

import type { AppRuntimeConstructionEntry } from './app-runtime.generator.js';

import { sortConstructionEntries } from './app-runtime.generator.js';

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
