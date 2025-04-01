import { describe, expect, it } from 'vitest';

import { createFieldMap } from './field-map.js';

describe('FieldMap', () => {
  describe('ScalarContainer', () => {
    it('should handle string fields with default values', () => {
      const fieldMap = createFieldMap((t) => ({
        name: t.string('default'),
      }));

      expect(fieldMap.getValues()).toEqual({ name: 'default' });
    });

    it('should allow setting string value once', () => {
      const fieldMap = createFieldMap((t) => ({
        name: t.string(),
      }));

      fieldMap.name.set('test', 'source1');
      expect(fieldMap.getValues()).toEqual({ name: 'test' });
    });

    it('should throw error when setting scalar value multiple times', () => {
      const fieldMap = createFieldMap((t) => ({
        name: t.string(),
      }));

      fieldMap.name.set('test', 'source1');
      expect(() => {
        fieldMap.name.set('another', 'source2');
      }).toThrow(
        'Value has already been set by source1 and cannot be overwritten by source2',
      );
    });
  });

  describe('ArrayContainer', () => {
    it('should handle arrays with default values', () => {
      const fieldMap = createFieldMap((t) => ({
        tags: t.array(['default']),
      }));

      expect(fieldMap.getValues()).toEqual({ tags: ['default'] });
    });

    it('should allow pushing values to array', () => {
      const fieldMap = createFieldMap((t) => ({
        tags: t.array<string>(),
      }));

      fieldMap.tags.push('tag1', 'tag2');
      expect(fieldMap.getValues()).toEqual({ tags: ['tag1', 'tag2'] });
    });

    it('should handle stripDuplicates option', () => {
      const fieldMap = createFieldMap((t) => ({
        tags: t.array<string>([], { stripDuplicates: true }),
      }));

      fieldMap.tags.push('tag1', 'tag2', 'tag1');
      expect(fieldMap.getValues()).toEqual({ tags: ['tag1', 'tag2'] });
    });
  });

  describe('MapContainer', () => {
    it('should handle maps with default values', () => {
      const defaultMap = new Map([['key1', 'value1']]);
      const fieldMap = createFieldMap((t) => ({
        settings: t.map(defaultMap),
      }));

      expect(fieldMap.getValues().settings).toEqual(defaultMap);
    });

    it('should allow setting individual values', () => {
      const fieldMap = createFieldMap((t) => ({
        settings: t.map<string, string>(),
      }));

      fieldMap.settings.set('key1', 'value1', 'source1');
      expect(fieldMap.getValues().settings).toEqual(
        new Map([['key1', 'value1']]),
      );
    });

    it('should throw error when setting map value multiple times', () => {
      const fieldMap = createFieldMap((t) => ({
        settings: t.map<string, string>(),
      }));

      fieldMap.settings.set('key1', 'value1', 'source1');
      expect(() => {
        fieldMap.settings.set('key1', 'value2', 'source2');
      }).toThrow(
        'Value for key key1 has already been set by source1 and cannot be overwritten by source2',
      );
    });

    it('should handle merging maps', () => {
      const fieldMap = createFieldMap((t) => ({
        settings: t.map<string, string>(),
      }));

      const newMap = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      fieldMap.settings.merge(newMap, 'source1');
      expect(fieldMap.getValues().settings).toEqual(newMap);
    });

    it('should handle merging objects', () => {
      const fieldMap = createFieldMap((t) => ({
        settings: t.map<string, string>(),
      }));

      fieldMap.settings.mergeObj({ key1: 'value1', key2: 'value2' }, 'source1');
      expect(fieldMap.getValues().settings).toEqual(
        new Map([
          ['key1', 'value1'],
          ['key2', 'value2'],
        ]),
      );
    });
  });

  describe('Mixed field types', () => {
    it('should handle multiple field types together', () => {
      const fieldMap = createFieldMap((t) => ({
        name: t.string('default'),
        age: t.number(25),
        isActive: t.boolean(true),
        tags: t.array(['tag1']),
        settings: t.mapFromObj({ key1: 'value1' }),
      }));

      expect(fieldMap.getValues()).toEqual({
        name: 'default',
        age: 25,
        isActive: true,
        tags: ['tag1'],
        settings: new Map([['key1', 'value1']]),
      });
    });
  });
});
