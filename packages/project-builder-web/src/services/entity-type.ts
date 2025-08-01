import type {
  DefinitionEntity,
  DefinitionEntityType,
  ProjectDefinitionContainer,
} from '@baseplate-dev/project-builder-lib';

const entityTypeToUrlMap: Record<string, string> = {};

export function getEntityTypeUrl(
  definitionContainer: ProjectDefinitionContainer,
  entity: DefinitionEntity,
): string | undefined {
  const typeUrl = entityTypeToUrlMap[entity.type.name];
  if (!typeUrl) return undefined;

  const entityParentPath = entity.parentPath?.join('.');
  const entityParent = entityParentPath
    ? definitionContainer.entities.find(
        (parentEntity) => parentEntity.idPath.join('.') === entityParentPath,
      )
    : undefined;

  return typeUrl
    .replace('{id}', entity.id)
    .replace('{key}', entity.type.keyFromId(entity.id))
    .replace('{parentId}', entityParent?.id ?? '')
    .replace(
      '{parentKey}',
      entityParent?.type.keyFromId(entityParent.id) ?? '',
    );
}

/**
 * Register a URL for an entity type.
 *
 * Use {id} as a placeholder for the entity ID and {key} for the random part of the ID.
 */
export function registerEntityTypeUrl(
  entityType: DefinitionEntityType,
  url: string,
): void {
  entityTypeToUrlMap[entityType.name] = url;
}
