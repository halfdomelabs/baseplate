import {
  modelEntityType,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';

export function createModelEditLink(modelId: string): string {
  const key = modelEntityType.isId(modelId)
    ? modelEntityType.keyFromId(modelId)
    : modelId;
  return `/data/models/edit/${key}`;
}

export function createEnumEditLink(enumId: string): string {
  const key = modelEnumEntityType.isId(enumId)
    ? modelEnumEntityType.keyFromId(enumId)
    : enumId;
  return `/data/enums/edit/${key}`;
}
