import type { SchemaStructureVisitor } from '@baseplate-dev/project-builder-lib';

import {
  definitionRefRegistry,
  walkSchemaStructure,
} from '@baseplate-dev/project-builder-lib';
import { validationHintRegistry } from '@baseplate-dev/utils';
import { z } from 'zod';

/**
 * Builds a Zod registry with description metadata for use with `zodToTs`.
 *
 * Walks the schema using `walkSchemaStructure` and populates descriptions
 * from two sources:
 * 1. `definitionRefRegistry` — annotates reference fields (@ref) and entity
 *    arrays (@entity) so callers know which fields are references
 * 2. `validationHintRegistry` — annotates fields with validation constraints
 *    like casing requirements (e.g., "CONSTANT_CASE", "camelCase")
 *
 * The returned registry can be passed as `metadataRegistry` to `zodToTs`
 * which will render the descriptions as JSDoc comments in the output.
 */
export function buildTsDescriptionRegistry(
  schema: z.ZodType,
): ReturnType<typeof z.registry<{ description?: string }>> {
  const registry = z.registry<{ description?: string }>();

  const visitor: SchemaStructureVisitor = {
    visit(visitedSchema) {
      const descriptions: string[] = [];

      // Check for ref/entity metadata from definitionRefRegistry
      const metaList = definitionRefRegistry.getAll(visitedSchema);
      for (const meta of metaList) {
        if (meta.kind === 'reference') {
          descriptions.push(
            `@ref(${meta.type.name}) - Reference to a '${meta.type.name}' entity. Use entity name, not ID.`,
          );
        } else if (meta.kind === 'entity') {
          descriptions.push(
            `@entity(${meta.type.name}) - Entity type '${meta.type.name}'. IDs are auto-generated; omit the id field.`,
          );
        }
      }

      // Check for validation hints from validationHintRegistry
      const hint = validationHintRegistry.get(visitedSchema);
      if (hint?.description) {
        descriptions.push(hint.description);
      }

      if (descriptions.length > 0) {
        registry.add(visitedSchema, {
          description: descriptions.join(' '),
        });
      }

      return undefined;
    },
  };

  walkSchemaStructure(schema, [visitor]);

  return registry;
}
