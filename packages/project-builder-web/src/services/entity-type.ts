import type {
  DefinitionEntity,
  PluginSpecStore,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';
import type {
  EntityNavTarget,
  EntityTypeUrlParams,
} from '@baseplate-dev/project-builder-lib/web';
import type {
  RegisteredRouter,
  ValidateNavigateOptions,
} from '@tanstack/react-router';

import { entityTypeUrlWebSpec } from '@baseplate-dev/project-builder-lib/web';
import { get } from 'es-toolkit/compat';

/**
 * Validates and returns navigate options at definition time.
 * TypeScript will error if the options don't match a valid route + params combination.
 */
function makeNavOptions<T>(
  options: ValidateNavigateOptions<RegisteredRouter, T>,
): ValidateNavigateOptions {
  return options as ValidateNavigateOptions;
}

/**
 * Maps an EntityNavTarget discriminated union to type-safe TanStack navigate options.
 */
function resolveEntityNavTarget(
  target: EntityNavTarget,
): ValidateNavigateOptions {
  switch (target.page) {
    case 'model': {
      if ('subpath' in target) {
        switch (target.subpath) {
          case 'service': {
            return makeNavOptions({
              to: '/data/models/edit/$key/service',
              params: { key: target.key },
            });
          }
          case 'authorization': {
            return makeNavOptions({
              to: '/data/models/edit/$key/authorization',
              params: { key: target.key },
            });
          }
          case 'graphql': {
            return makeNavOptions({
              to: '/data/models/edit/$key/graphql',
              params: { key: target.key },
            });
          }
        }
      }
      return makeNavOptions({
        to: '/data/models/edit/$key',
        params: { key: target.key },
      });
    }
    case 'enum': {
      return makeNavOptions({
        to: '/data/enums/edit/$key',
        params: { key: target.key },
      });
    }
    case 'plugin': {
      return makeNavOptions({
        to: '/plugins/edit/$key',
        params: { key: target.key },
      });
    }
    case 'app': {
      return makeNavOptions({
        to: '/packages/apps/$key',
        params: { key: target.key },
      });
    }
    case 'lib': {
      return makeNavOptions({
        to: '/packages/libs/$key',
        params: { key: target.key },
      });
    }
    case 'admin-section': {
      return makeNavOptions({
        to: '/admin-sections/$appKey/edit/$sectionKey',
        params: { appKey: target.appKey, sectionKey: target.sectionKey },
      });
    }
  }
}

function resolveParentEntity(
  definition: ProjectDefinitionContainer,
  entity: DefinitionEntity,
): DefinitionEntity | undefined {
  if (!entity.parentPath) return undefined;
  const parentId = get(definition.definition, entity.parentPath) as
    | string
    | undefined;
  if (typeof parentId !== 'string') {
    console.warn(
      `[resolveParentEntity] Parent ID is not a string for entity "${entity.id}" (type: ${entity.type.name})`,
    );
    return undefined;
  }
  if (!parentId) return undefined;
  return definition.entityFromId(parentId);
}

function getEntityNavTarget(
  definitionContainer: ProjectDefinitionContainer,
  entity: DefinitionEntity,
  pluginContainer: PluginSpecStore,
): EntityNavTarget | undefined {
  const builder = pluginContainer
    .use(entityTypeUrlWebSpec)
    .getNavBuilder(entity.type);
  if (!builder) return undefined;

  const entityParent = resolveParentEntity(definitionContainer, entity);

  if (entity.parentPath && !entityParent) {
    console.warn(
      `[getEntityNavTarget] Could not find parent entity for entity "${entity.id}" (type: ${entity.type.name})`,
    );
  }

  const entityGrandparent = entityParent
    ? resolveParentEntity(definitionContainer, entityParent)
    : undefined;

  if (entityParent?.parentPath && !entityGrandparent) {
    console.warn(
      `[getEntityNavTarget] Could not find grandparent entity for entity "${entity.id}" (type: ${entity.type.name})`,
    );
  }

  const params: EntityTypeUrlParams = {
    entityId: entity.id,
    entityKey: entity.type.keyFromId(entity.id),
    parentId: entityParent?.id,
    parentKey: entityParent?.type.keyFromId(entityParent.id),
    grandparentId: entityGrandparent?.id,
    grandparentKey: entityGrandparent?.type.keyFromId(entityGrandparent.id),
  };

  return builder(params);
}

export function getEntityNavOptions(
  definitionContainer: ProjectDefinitionContainer,
  entity: DefinitionEntity,
  pluginContainer: PluginSpecStore,
): ValidateNavigateOptions | undefined {
  const target = getEntityNavTarget(
    definitionContainer,
    entity,
    pluginContainer,
  );
  return target ? resolveEntityNavTarget(target) : undefined;
}
