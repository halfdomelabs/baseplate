import {
  DefinitionEntity,
  DefinitionEntityType,
} from '@halfdomelabs/project-builder-lib';

const entityTypeToUrlMap: Record<string, string> = {};

export function getEntityTypeUrl(entity: DefinitionEntity): string | undefined {
  const typeUrl = entityTypeToUrlMap[entity.type.name];
  if (!typeUrl) return undefined;
  return typeUrl
    .replace('{id}', entity.id)
    .replace('{uid}', entity.type.getUidFromId(entity.id));
}

/**
 * Register a URL for an entity type.
 *
 * Use {id} as a placeholder for the entity ID and {uid} for the random part of the ID.
 */
export function registerEntityTypeUrl(
  entityType: DefinitionEntityType,
  url: string,
): void {
  entityTypeToUrlMap[entityType.name] = url;
}
