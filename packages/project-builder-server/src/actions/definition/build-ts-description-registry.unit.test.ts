import {
  createEntityType,
  definitionRefRegistry,
} from '@baseplate-dev/project-builder-lib';
import { CASE_VALIDATORS } from '@baseplate-dev/utils';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { buildTsDescriptionRegistry } from './build-ts-description-registry.js';

describe('buildTsDescriptionRegistry', () => {
  it('should annotate reference fields with @ref', () => {
    const entityType = createEntityType('feature');
    const refSchema = z.string().min(1);
    definitionRefRegistry.add(refSchema, {
      kind: 'reference',
      type: entityType,
      onDelete: 'RESTRICT',
    });

    const schema = z.object({ featureRef: refSchema });
    const registry = buildTsDescriptionRegistry(schema);

    const meta = registry.get(refSchema);
    expect(meta?.description).toContain('@ref(feature)');
    expect(meta?.description).toContain('Use entity name, not ID');
  });

  it('should annotate entity schemas with @entity', () => {
    const entityType = createEntityType('adapter');
    const innerSchema = z.object({ id: z.string(), name: z.string() });
    definitionRefRegistry.add(innerSchema, {
      kind: 'entity',
      type: entityType,
      idPath: ['id'],
    });

    const schema = z.object({ adapters: z.array(innerSchema) });
    const registry = buildTsDescriptionRegistry(schema);

    const meta = registry.get(innerSchema);
    expect(meta?.description).toContain('@entity(adapter)');
    expect(meta?.description).toContain('IDs are auto-generated');
  });

  it('should not annotate plain schemas without metadata', () => {
    const plainSchema = z.string();
    const schema = z.object({ name: plainSchema });
    const registry = buildTsDescriptionRegistry(schema);

    expect(registry.get(plainSchema)).toBeUndefined();
  });

  it('should include validation hints from validationHintRegistry', () => {
    const schema = z.object({
      code: CASE_VALIDATORS.CONSTANT_CASE,
    });
    const registry = buildTsDescriptionRegistry(schema);

    const meta = registry.get(CASE_VALIDATORS.CONSTANT_CASE);
    expect(meta?.description).toContain('CONSTANT_CASE');
  });
});
