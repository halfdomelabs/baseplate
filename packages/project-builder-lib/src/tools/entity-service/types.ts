import type { z } from 'zod';

import type { SchemaPathElement } from '#src/parser/walk-schema-structure.js';
import type { EntitySchemaMeta } from '#src/references/definition-ref-registry.js';
import type {
  DefinitionEntity,
  DefinitionEntityType,
} from '#src/references/types.js';

/**
 * Metadata about an entity type's location in the definition schema.
 */
export interface EntityTypeMetadata {
  /** Entity type name (e.g., "model", "model-scalar-field") */
  name: string;
  /** The DefinitionEntityType instance */
  entityType: DefinitionEntityType;
  /** Entity metadata from schema annotations */
  entityMeta: EntitySchemaMeta;
  /** Element schema for the entity array */
  elementSchema: z.ZodType;
  /** Path from parent entity (or root) to this entity's array */
  relativePath: SchemaPathElement[];
  /** Parent entity type name, if this is a nested entity */
  parentEntityTypeName?: string;
}

/**
 * Map from entity type name to its metadata.
 * Built once from the schema and reused for all operations.
 */
export type EntityTypeMap = Map<string, EntityTypeMetadata>;

export interface EntityServiceContext {
  /**
   * The serialized definition but with defaults provided.
   */
  serializedDefinition: Record<string, unknown>;
  /**
   * The entity type map built from the schema.
   */
  entityTypeMap: EntityTypeMap;
  /**
   * Looks up an entity by its ID.
   */
  lookupEntity: (entityId: string) => DefinitionEntity | undefined;
}
