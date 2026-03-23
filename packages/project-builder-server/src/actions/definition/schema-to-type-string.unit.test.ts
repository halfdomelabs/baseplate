import {
  createEntityType,
  definitionRefRegistry,
} from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { schemaToTypeString } from './schema-to-type-string.js';

describe('schemaToTypeString', () => {
  it('should convert a simple object schema to a TypeScript string', () => {
    const schema = z.object({
      name: z.string(),
      age: z.number().optional(),
    });

    const result = schemaToTypeString(schema);

    expect(result).toContain('name: string');
    expect(result).toContain('age?: number');
  });

  it('should include JSDoc comments for ref fields', () => {
    const testEntityType = createEntityType('test-entity');
    const refSchema = z.string().min(1);
    definitionRefRegistry.add(refSchema, {
      kind: 'reference',
      type: testEntityType,
      onDelete: 'RESTRICT',
    });

    const schema = z.object({
      testRef: refSchema,
      plainField: z.string(),
    });

    const result = schemaToTypeString(schema);

    expect(result).toContain('@ref(test-entity)');
    expect(result).toContain('testRef: string');
    expect(result).toContain('plainField: string');
  });

  it('should not add JSDoc to fields without ref metadata', () => {
    const schema = z.object({
      plainString: z.string(),
      plainNumber: z.number(),
    });

    const result = schemaToTypeString(schema);

    expect(result).not.toContain('/**');
    expect(result).toContain('plainString: string');
    expect(result).toContain('plainNumber: number');
  });

  it('should handle schemas with nested objects and arrays', () => {
    const schema = z.object({
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
        }),
      ),
    });

    const result = schemaToTypeString(schema);

    expect(result).toContain('items:');
    expect(result).toContain('id: string');
    expect(result).toContain('label: string');
  });
});
