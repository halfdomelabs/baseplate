import type { DefinitionEntityType } from '#src/references/types.js';

import { createPluginSpec } from '#src/plugins/spec/types.js';

/**
 * Parameters passed to an entity type nav builder, conditioned on whether the
 * entity type has a parent. If THasParent is true, parentId/parentKey are required
 * strings. If false, they are undefined. grandparentId/grandparentKey follow the
 * same pattern based on whether the parent type itself has a parent.
 */
export interface EntityTypeUrlParams<THasParent extends boolean = boolean> {
  entityId: string;
  entityKey: string;
  parentId: THasParent extends true ? string : undefined;
  parentKey: THasParent extends true ? string : undefined;
  grandparentId: string | undefined;
  grandparentKey: string | undefined;
}

/**
 * Discriminated union of all navigable entity pages.
 * This is router-agnostic — the web layer maps these to concrete navigate options.
 *
 * Plugins returning an EntityNavTarget do not need to know about TanStack routes.
 */
export type EntityNavTarget =
  | { page: 'model'; key: string }
  | {
      page: 'model';
      key: string;
      subpath: 'service' | 'authorization' | 'graphql';
    }
  | { page: 'enum'; key: string }
  | { page: 'plugin'; key: string }
  | { page: 'app'; key: string }
  | { page: 'lib'; key: string }
  | { page: 'admin-section'; appKey: string; sectionKey: string };

/**
 * Builder function type conditioned on whether the entity has a parent.
 * If THasParent is true, parentId and parentKey are required strings.
 * If false, they are undefined. grandparentId/grandparentKey are always
 * string | undefined since the parent's parent may or may not exist.
 */
export type EntityTypeNavBuilder<THasParent extends boolean = boolean> = (
  params: EntityTypeUrlParams<THasParent>,
) => EntityNavTarget | undefined;

/**
 * Spec for registering navigation builder functions for definition entity types.
 *
 * Use `register(entityType, builder)` during initialization. If the entity type
 * has a parent (THasParent = true), parentId and parentKey are required strings
 * in the builder's params. grandparentId/grandparentKey are always optional and
 * available for grandchild entity types.
 *
 * After initialization, use `getNavBuilder(entityType)` to retrieve the builder.
 */
export const entityTypeUrlWebSpec = createPluginSpec(
  'core/entity-type-url-web',
  {
    initializer: () => {
      const builders = new Map<string, EntityTypeNavBuilder>();
      return {
        init: {
          register: <THasParent extends boolean>(
            entityType: DefinitionEntityType<THasParent>,
            builder: EntityTypeNavBuilder<THasParent>,
          ): void => {
            builders.set(entityType.name, builder as EntityTypeNavBuilder);
          },
        },
        use: () => ({
          getNavBuilder: (
            entityType: DefinitionEntityType,
          ): EntityTypeNavBuilder | undefined => builders.get(entityType.name),
        }),
      };
    },
  },
);
