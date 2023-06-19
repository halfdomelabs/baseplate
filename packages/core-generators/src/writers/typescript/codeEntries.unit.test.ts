import { describe, it, expect } from 'vitest';
import {
  mergeCodeEntryOptions,
  TypescriptCodeBlock,
  TypescriptCodeExpression,
} from './codeEntries.js';

describe('mergeCodeEntryOptions', () => {
  it('should merge relevant expressions', () => {
    const expressions = [
      new TypescriptCodeExpression('foo', null, {
        imports: [{ moduleSpecifier: 'hi' }],
        importText: ['foo', 'foo2'],
        headerBlocks: [new TypescriptCodeBlock('block1')],
      }),
      new TypescriptCodeExpression('foo', null, {
        imports: [{ moduleSpecifier: 'hi2' }],
        importText: ['foo3', 'foo4'],
        headerBlocks: [new TypescriptCodeBlock('block2')],
      }),
    ];

    const mergedOptions = mergeCodeEntryOptions(expressions);

    expect(mergedOptions).toMatchObject({
      imports: [{ moduleSpecifier: 'hi' }, { moduleSpecifier: 'hi2' }],
      importText: ['foo', 'foo2', 'foo3', 'foo4'],
    });
    expect(mergedOptions.headerBlocks).toHaveLength(2);
  });
});
