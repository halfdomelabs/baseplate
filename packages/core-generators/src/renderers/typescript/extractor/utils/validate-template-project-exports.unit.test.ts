import { describe, expect, it } from 'vitest';

import {
  buildMissingProjectExportsMessage,
  findMissingProjectExports,
} from './validate-template-project-exports.js';

const FILE_PATH = '/project/src/services/example.ts';

describe('findMissingProjectExports', () => {
  it('returns nothing when every declared export exists', () => {
    const contents = `
      export function createThing(): void {}
      export interface Thing {}
      export enum ThingKind { A }
      export namespace ThingUtils {}
    `;
    expect(
      findMissingProjectExports(
        {
          createThing: {},
          Thing: { isTypeOnly: true },
          ThingKind: {},
          ThingUtils: {},
        },
        FILE_PATH,
        contents,
      ),
    ).toEqual([]);
  });

  it('reports declared exports that are missing, sorted', () => {
    const contents = `export function createThing(): void {}`;
    expect(
      findMissingProjectExports(
        { renamedThing: {}, createThing: {}, MissingThing: {} },
        FILE_PATH,
        contents,
      ),
    ).toEqual(['MissingThing', 'renamedThing']);
  });

  it('matches on exportedAs rather than the entry key', () => {
    const contents = `
      const internalName = 1;
      export { internalName as publicName };
    `;
    expect(
      findMissingProjectExports(
        { thing: { exportedAs: 'publicName' } },
        FILE_PATH,
        contents,
      ),
    ).toEqual([]);
    expect(
      findMissingProjectExports(
        { thing: { exportedAs: 'internalName' } },
        FILE_PATH,
        contents,
      ),
    ).toEqual(['internalName']);
  });

  it('resolves default exports', () => {
    const contents = `export default function thing(): void {}`;
    expect(
      findMissingProjectExports(
        { thing: { exportedAs: 'default' } },
        FILE_PATH,
        contents,
      ),
    ).toEqual([]);
  });

  it('resolves re-exports from other modules', () => {
    const contents = `export type { AuthRole } from '@src/gql/graphql';`;
    expect(
      findMissingProjectExports({ AuthRole: {} }, FILE_PATH, contents),
    ).toEqual([]);
  });

  it('ignores the wildcard entry', () => {
    const contents = `export const thing = 1;`;
    expect(
      findMissingProjectExports({ '*': {}, thing: {} }, FILE_PATH, contents),
    ).toEqual([]);
  });

  it('skips files with star re-exports since exports may be transitive', () => {
    const contents = `
      export * from './other.js';
      export const thing = 1;
    `;
    expect(
      findMissingProjectExports(
        { thing: {}, somethingElse: {} },
        FILE_PATH,
        contents,
      ),
    ).toEqual([]);
  });

  it('does not skip files with named namespace re-exports', () => {
    const contents = `export * as other from './other.js';`;
    expect(
      findMissingProjectExports(
        { other: {}, missing: {} },
        FILE_PATH,
        contents,
      ),
    ).toEqual(['missing']);
  });

  it('returns nothing when no project exports are declared', () => {
    expect(findMissingProjectExports(undefined, FILE_PATH, '')).toEqual([]);
  });
});

describe('buildMissingProjectExportsMessage', () => {
  it('names the generator, template, symbols and file for each entry', () => {
    const message = buildMissingProjectExportsMessage([
      {
        generatorName: 'auth/auth-context',
        templateName: 'auth-context-utils',
        sourceAbsolutePath: FILE_PATH,
        missingExports: ['createAnonymousAuthContext', 'createThing'],
      },
      {
        generatorName: 'stripe/billing-module',
        templateName: 'billing-service',
        sourceAbsolutePath: '/project/src/services/billing.ts',
        missingExports: ['handleSubscriptionEvent'],
      },
    ]);

    expect(message).toContain(
      `auth/auth-context#auth-context-utils: createAnonymousAuthContext, createThing (${FILE_PATH})`,
    );
    expect(message).toContain(
      'stripe/billing-module#billing-service: handleSubscriptionEvent (/project/src/services/billing.ts)',
    );
  });
});
