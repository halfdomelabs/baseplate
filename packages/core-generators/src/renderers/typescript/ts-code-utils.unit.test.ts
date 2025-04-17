import { describe, expect, it } from 'vitest';

import { tsCodeFragment, tsHoistedFragment } from './fragments/creators.js';
import { tsImportBuilder } from './imports/builder.js';
import { TsCodeUtils } from './ts-code-utils.js';

describe('TsCodeUtils', () => {
  describe('mergeFragments', () => {
    it('should merge multiple fragments with their contents, imports and hoisted fragments', () => {
      const fooImport = tsImportBuilder().named('foo').from('./foo.js');
      const barImport = tsImportBuilder().named('bar').from('./bar.js');
      const h1Fragment = tsHoistedFragment(
        tsCodeFragment('type A = string;'),
        'h1',
      );
      const h2Fragment = tsHoistedFragment(
        tsCodeFragment('type B = number;'),
        'h2',
      );
      const fragments = new Map([
        [
          'b',
          tsCodeFragment('const b = 2;', barImport, {
            hoistedFragments: [h2Fragment],
          }),
        ],
        [
          'a',
          tsCodeFragment('const a = 1;', fooImport, {
            hoistedFragments: [h1Fragment],
          }),
        ],
      ]);

      const result = TsCodeUtils.mergeFragments(fragments);

      expect(result).toEqual({
        contents: 'const a = 1;\nconst b = 2;',
        imports: [fooImport, barImport],
        hoistedFragments: [h1Fragment, h2Fragment],
      });
    });

    it('should handle empty fragments map', () => {
      const result = TsCodeUtils.mergeFragments(new Map());
      expect(result).toEqual({
        contents: '',
        imports: [],
        hoistedFragments: [],
      });
    });
  });

  describe('mergeFragmentsPresorted', () => {
    it('should merge multiple fragments with their contents, imports and hoisted fragments', () => {
      const fooImport = tsImportBuilder().named('foo').from('./foo.js');
      const barImport = tsImportBuilder().named('bar').from('./bar.js');
      const h1Fragment = tsHoistedFragment(
        tsCodeFragment('type A = string;'),
        'h1',
      );
      const fragments = [
        tsCodeFragment('const a = 1;', fooImport, {
          hoistedFragments: [h1Fragment],
        }),
        tsCodeFragment('const b = 2;', barImport),
      ];
      const result = TsCodeUtils.mergeFragmentsPresorted(fragments);

      expect(result).toEqual({
        contents: 'const a = 1;\nconst b = 2;',
        imports: [fooImport, barImport],
        hoistedFragments: [h1Fragment],
      });
    });
  });

  describe('formatAsComment', () => {
    it('should format single line text as comment', () => {
      const result = TsCodeUtils.formatAsComment('Hello world');
      expect(result).toBe('// Hello world');
    });

    it('should format multiline text as comments', () => {
      const result = TsCodeUtils.formatAsComment('Hello\nworld');
      expect(result).toBe('// Hello\n// world');
    });
  });

  describe('formatFragment', () => {
    it('should format string with fragment placeholders', () => {
      const args = {
        VAR1: tsCodeFragment(
          'foo',
          tsImportBuilder().named('foo').from('./foo.js'),
        ),
        VAR2: 'bar',
      };

      const result = TsCodeUtils.formatFragment('const VAR1 = "VAR2";', args);

      expect(result).toEqual({
        contents: 'const foo = "bar";',
        imports: [{ namedImports: [{ name: 'foo' }], source: './foo.js' }],
        hoistedFragments: [],
      });
    });

    it('should throw error for invalid placeholder names', () => {
      expect(() => {
        TsCodeUtils.formatFragment('const $VAR = 1;', { $VAR: 'value' });
      }).toThrow('All arguments for format must follow [A-Z0-9_-]');
    });
  });

  describe('mergeFragmentsAsObject', () => {
    it('should merge fragments into a sorted object literal', () => {
      const obj = {
        prop2: tsCodeFragment('string value'),
        prop1: tsCodeFragment('42'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result).toEqual({
        contents: '{prop1: 42,\nprop2: string value,}',
        imports: [],
        hoistedFragments: [],
      });
    });

    it('should merge fragments into an object literal with no sorting and spread operators', () => {
      const obj = {
        prop1: tsCodeFragment(
          '42',
          tsImportBuilder().default('foo').from('./foo.js'),
        ),
        prop2: 'string value',
        '...spread': tsCodeFragment(
          'restProps',
          tsImportBuilder().default('bar').from('./bar.js'),
        ),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj, {
        disableSort: true,
      });

      expect(result).toEqual({
        contents: '{prop1: 42,\nprop2: string value,\n...restProps,}',
        imports: [
          { defaultImport: 'foo', source: './foo.js' },
          { defaultImport: 'bar', source: './bar.js' },
        ],
        hoistedFragments: [],
      });
    });

    it('should escape keys that are not valid identifiers', () => {
      const obj = {
        'invalid-key': tsCodeFragment('42'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result.contents).toBe('{"invalid-key": 42,}');
    });

    it('should wrap with parenthesis when option is set', () => {
      const obj = {
        prop: tsCodeFragment('42'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj, {
        wrapWithParenthesis: true,
      });

      expect(result.contents).toBe('({prop: 42,})');
    });

    it('should handle undefined values', () => {
      const obj = {
        prop1: tsCodeFragment('42'),
        prop2: undefined,
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result.contents).toBe('{prop1: 42,}');
    });

    it('should handle property shorthand', () => {
      const obj = {
        value: tsCodeFragment('value'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result.contents).toBe('{value,}');
    });

    it('should handle function declarations', () => {
      const obj = {
        value: tsCodeFragment('function value() { return 42; }'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result.contents).toBe('{value() { return 42; },}');
    });

    it('should handle async function declarations', () => {
      const obj = {
        value: tsCodeFragment('async function value() { return 42; }'),
      };

      const result = TsCodeUtils.mergeFragmentsAsObject(obj);

      expect(result.contents).toBe('{async value() { return 42; },}');
    });
  });

  describe('mergeFragmentsAsArray', () => {
    it('should merge multiple fragments into an array literal with their contents, imports and hoisted fragments', () => {
      const fooImport = tsImportBuilder().named('foo').from('./foo.js');
      const barImport = tsImportBuilder().named('bar').from('./bar.js');
      const h1Fragment = tsHoistedFragment(
        tsCodeFragment('type A = string;'),
        'h1',
      );
      const h2Fragment = tsHoistedFragment(
        tsCodeFragment('type B = number;'),
        'h2',
      );
      const fragments = new Map([
        [
          'b',
          tsCodeFragment('2', barImport, {
            hoistedFragments: [h2Fragment],
          }),
        ],
        [
          'a',
          tsCodeFragment('1', fooImport, {
            hoistedFragments: [h1Fragment],
          }),
        ],
      ]);

      const result = TsCodeUtils.mergeFragmentsAsArray(fragments);

      expect(result).toEqual({
        contents: '[1,\n2]',
        imports: [fooImport, barImport],
        hoistedFragments: [h1Fragment, h2Fragment],
      });
    });

    it('should handle empty fragments map', () => {
      const result = TsCodeUtils.mergeFragmentsAsArray(new Map());
      expect(result).toEqual({
        contents: '[]',
        imports: [],
        hoistedFragments: [],
      });
    });

    it('should handle string fragments', () => {
      const fragments = new Map([
        ['a', '1'],
        ['b', '2'],
      ]);

      const result = TsCodeUtils.mergeFragmentsAsArray(fragments);

      expect(result).toEqual({
        contents: '[1,\n2]',
        imports: [],
        hoistedFragments: [],
      });
    });
  });
});
