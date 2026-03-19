import { TsCodeUtils } from '@baseplate-dev/core-generators';
import { describe, expect, it } from 'vitest';

import type { InputFieldDefinitionOutput } from '../field-definition-generators/types.js';

import {
  buildFieldSchemasObject,
  buildNestedSchemaFragments,
} from './build-schema-fragments.js';

function createMockField(
  name: string,
  schemaContents: string,
): InputFieldDefinitionOutput {
  return {
    name,
    schemaFragment: TsCodeUtils.frag(schemaContents),
    isTransformField: false,
    outputDtoField: {
      name,
      type: 'scalar',
      scalarType: 'string',
    },
  };
}

describe('buildFieldSchemasObject', () => {
  it('should build a schema entries object from field definitions', () => {
    const fields = [
      createMockField('name', 'z.string()'),
      createMockField('age', 'z.number()'),
    ];

    const result = buildFieldSchemasObject(fields);

    expect(result.contents).toMatchInlineSnapshot(`
      "{age: z.number(),
      name: z.string(),}"
    `);
  });

  it('should preserve field order when disableSort is true', () => {
    const fields = [
      createMockField('name', 'z.string()'),
      createMockField('age', 'z.number()'),
    ];

    const result = buildFieldSchemasObject(fields, { disableSort: true });

    expect(result.contents).toMatchInlineSnapshot(`
      "{name: z.string(),
      age: z.number(),}"
    `);
  });

  it('should handle a single field', () => {
    const fields = [createMockField('email', 'z.string().email()')];

    const result = buildFieldSchemasObject(fields);

    expect(result.contents).toMatchInlineSnapshot(
      `"{email: z.string().email(),}"`,
    );
  });
});

describe('buildNestedSchemaFragments', () => {
  describe('no data service (inline)', () => {
    it('should build inline schema for one-to-many', () => {
      const fields = [createMockField('role', 'z.string()')];

      const result = buildNestedSchemaFragments({
        fields,
        fieldNames: ['role'],
        isList: true,
      });

      expect(result.itemSchema.contents).toContain('z.object');
      expect(result.itemSchema.contents).toContain('role: z.string()');
      expect(result.schemaFragment.contents).toContain('z.array');
      expect(result.schemaFragment.contents).toContain('.optional()');
    });

    it('should build inline schema for one-to-one', () => {
      const fields = [createMockField('bio', 'z.string()')];

      const result = buildNestedSchemaFragments({
        fields,
        fieldNames: ['bio'],
        isList: false,
      });

      expect(result.itemSchema.contents).toContain('z.object');
      expect(result.schemaFragment.contents).toContain('.nullish()');
    });
  });

  describe('with fieldSchemas import (all fields)', () => {
    it('should use fieldSchemas directly for one-to-many', () => {
      const fieldSchemasFragment = TsCodeUtils.frag('userImageFieldSchemas');

      const result = buildNestedSchemaFragments({
        fields: [],
        fieldNames: ['caption', 'file'],
        isList: true,
        nestedFieldSchemasFragment: fieldSchemasFragment,
        allDataServiceFieldNames: ['caption', 'file'],
      });

      expect(result.itemSchema.contents).toContain(
        'z.object(userImageFieldSchemas)',
      );
      expect(result.schemaFragment.contents).toContain(
        'z.array(z.object(userImageFieldSchemas)).optional()',
      );
    });

    it('should use fieldSchemas directly for one-to-one', () => {
      const fieldSchemasFragment = TsCodeUtils.frag('customerFieldSchemas');

      const result = buildNestedSchemaFragments({
        fields: [],
        fieldNames: ['stripeCustomerId'],
        isList: false,
        nestedFieldSchemasFragment: fieldSchemasFragment,
        allDataServiceFieldNames: ['stripeCustomerId'],
      });

      expect(result.itemSchema.contents).toContain(
        'z.object(customerFieldSchemas)',
      );
      expect(result.schemaFragment.contents).toContain(
        'z.object(customerFieldSchemas).nullish()',
      );
    });
  });

  describe('with fieldSchemas import (subset)', () => {
    it('should use pick() for subset fields', () => {
      const fieldSchemasFragment = TsCodeUtils.frag('userProfileFieldSchemas');

      const result = buildNestedSchemaFragments({
        fields: [],
        fieldNames: ['bio', 'avatar'],
        isList: false,
        nestedFieldSchemasFragment: fieldSchemasFragment,
        allDataServiceFieldNames: ['bio', 'avatar', 'twitterHandle'],
      });

      expect(result.itemSchema.contents).toContain(
        'pick(userProfileFieldSchemas',
      );
      expect(result.itemSchema.contents).toContain("'bio'");
      expect(result.itemSchema.contents).toContain("'avatar'");
      expect(result.schemaFragment.contents).toContain('.nullish()');
    });

    it('should use pick() for list subset', () => {
      const fieldSchemasFragment = TsCodeUtils.frag('attachmentFieldSchemas');

      const result = buildNestedSchemaFragments({
        fields: [],
        fieldNames: ['position', 'url'],
        isList: true,
        nestedFieldSchemasFragment: fieldSchemasFragment,
        allDataServiceFieldNames: ['position', 'url', 'createdAt'],
      });

      expect(result.itemSchema.contents).toContain(
        'pick(attachmentFieldSchemas',
      );
      expect(result.schemaFragment.contents).toContain('z.array');
      expect(result.schemaFragment.contents).toContain('.optional()');
    });
  });
});
