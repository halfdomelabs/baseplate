import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type {
  DefinitionExpression,
  RefExpressionDependency,
  RefExpressionParseResult,
} from './expression-types.js';
import type { DefinitionEntity, ResolvedZodRefPayload } from './types.js';

import { RefExpressionParser } from './expression-types.js';
import { applyExpressionRenames } from './fix-expression-renames.js';
import { createEntityType } from './types.js';

const testEntityType = createEntityType('test-entity');

/**
 * A fake parser that returns configurable dependencies from getReferencedEntities.
 */
class FakeParser extends RefExpressionParser<string, string> {
  readonly name = 'fake';
  private readonly deps: RefExpressionDependency[];
  private readonly shouldFailParse: boolean;

  constructor(
    deps: RefExpressionDependency[] = [],
    options?: { shouldFailParse?: boolean },
  ) {
    super();
    this.deps = deps;
    this.shouldFailParse = options?.shouldFailParse ?? false;
  }

  createSchema(): z.ZodType<string> {
    return z.string();
  }

  parse(value: string): RefExpressionParseResult<string> {
    if (this.shouldFailParse) {
      return { success: false, error: 'Parse failed' };
    }
    return { success: true, value };
  }

  getWarnings(): [] {
    return [];
  }

  getReferencedEntities(): RefExpressionDependency[] {
    return this.deps;
  }
}

function makeEntity(id: string, name: string): DefinitionEntity {
  return {
    id,
    name,
    type: testEntityType,
    path: [],
    idPath: ['id'],
  };
}

function makeExpression(
  value: string,
  parser: FakeParser,
  path: (string | number)[] = ['expressions', 0],
): DefinitionExpression {
  return {
    value,
    parser,
    path,
    resolvedSlots: {},
  };
}

function makeOldPayload(
  data: unknown,
  entities: DefinitionEntity[],
  expressions: DefinitionExpression[],
): ResolvedZodRefPayload<unknown> {
  return { data, entities, references: [], expressions };
}

describe('applyExpressionRenames', () => {
  it('should apply a single rename', () => {
    const parser = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 5 },
    ]);

    const result = applyExpressionRenames(
      { expressions: ['hello world'] }, // new definition (expressions not yet updated)
      [makeEntity('e:1', 'world')], // new entities (renamed)
      makeOldPayload(
        { expressions: ['hello world'] },
        [makeEntity('e:1', 'hello')], // old entity name was 'hello'
        [makeExpression('hello world', parser, ['expressions', 0])],
      ),
    );

    expect(result.modified).toBe(true);
    expect(result.value).toEqual({ expressions: ['world world'] });
  });

  it('should apply multiple renames in descending position order', () => {
    const parser = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 3 },
      { entityType: testEntityType, entityId: 'e:2', start: 4, end: 7 },
    ]);

    const result = applyExpressionRenames(
      { expr: 'aaa bbb' },
      [makeEntity('e:1', 'xxx'), makeEntity('e:2', 'yyy')],
      makeOldPayload(
        { expr: 'aaa bbb' },
        [makeEntity('e:1', 'aaa'), makeEntity('e:2', 'bbb')],
        [makeExpression('aaa bbb', parser, ['expr'])],
      ),
    );

    expect(result.modified).toBe(true);
    expect(result.value).toEqual({ expr: 'xxx yyy' });
  });

  it('should return modified: false when no entities were renamed', () => {
    const parser = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 5 },
    ]);

    const result = applyExpressionRenames(
      { expr: 'hello' },
      [makeEntity('e:1', 'hello')],
      makeOldPayload(
        { expr: 'hello' },
        [makeEntity('e:1', 'hello')], // same name — no rename
        [makeExpression('hello', parser, ['expr'])],
      ),
    );

    expect(result.modified).toBe(false);
    expect(result.value).toEqual({ expr: 'hello' });
  });

  it('should return modified: false when no expressions exist', () => {
    const result = applyExpressionRenames(
      { expr: 'hello' },
      [makeEntity('e:1', 'world')],
      makeOldPayload(
        { expr: 'hello' },
        [makeEntity('e:1', 'hello')],
        [], // no expressions
      ),
    );

    expect(result.modified).toBe(false);
  });

  it('should skip expressions where parse fails', () => {
    const failingParser = new FakeParser(
      [{ entityType: testEntityType, entityId: 'e:1', start: 0, end: 5 }],
      { shouldFailParse: true },
    );

    const result = applyExpressionRenames(
      { expr: 'hello' },
      [makeEntity('e:1', 'world')],
      makeOldPayload(
        { expr: 'hello' },
        [makeEntity('e:1', 'hello')],
        [makeExpression('hello', failingParser, ['expr'])],
      ),
    );

    expect(result.modified).toBe(false);
    expect(result.value).toEqual({ expr: 'hello' });
  });

  it('should skip dependencies whose entity ID was not renamed', () => {
    const parser = new FakeParser([
      { entityType: testEntityType, entityId: 'e:2', start: 0, end: 5 },
    ]);

    const result = applyExpressionRenames(
      { expr: 'hello' },
      [makeEntity('e:1', 'world'), makeEntity('e:2', 'hello')],
      makeOldPayload(
        { expr: 'hello' },
        [makeEntity('e:1', 'old'), makeEntity('e:2', 'hello')], // e:1 renamed, but dep is on e:2
        [makeExpression('hello', parser, ['expr'])],
      ),
    );

    expect(result.modified).toBe(false);
  });

  it('should handle multiple expressions in the same definition', () => {
    const parser1 = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 3 },
    ]);
    const parser2 = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 3 },
    ]);

    const result = applyExpressionRenames(
      { items: [{ expr: 'foo' }, { expr: 'foo bar' }] },
      [makeEntity('e:1', 'baz')],
      makeOldPayload(
        { items: [{ expr: 'foo' }, { expr: 'foo bar' }] },
        [makeEntity('e:1', 'foo')],
        [
          makeExpression('foo', parser1, ['items', 0, 'expr']),
          makeExpression('foo bar', parser2, ['items', 1, 'expr']),
        ],
      ),
    );

    expect(result.modified).toBe(true);
    expect(result.value).toEqual({
      items: [{ expr: 'baz' }, { expr: 'baz bar' }],
    });
  });

  it('should handle renames that change string length', () => {
    const parser = new FakeParser([
      { entityType: testEntityType, entityId: 'e:1', start: 0, end: 2 },
      { entityType: testEntityType, entityId: 'e:2', start: 3, end: 4 },
    ]);

    const result = applyExpressionRenames(
      { expr: 'ab c' },
      [makeEntity('e:1', 'xxxx'), makeEntity('e:2', 'yyyyy')],
      makeOldPayload(
        { expr: 'ab c' },
        [makeEntity('e:1', 'ab'), makeEntity('e:2', 'c')],
        [makeExpression('ab c', parser, ['expr'])],
      ),
    );

    expect(result.modified).toBe(true);
    expect(result.value).toEqual({ expr: 'xxxx yyyyy' });
  });
});
