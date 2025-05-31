import {
  modelEntityType,
  modelEnumEntityType,
} from '@baseplate-dev/project-builder-lib';

export function createModelEditLink(modelId: string): string {
  const uid = modelEntityType.isId(modelId)
    ? modelEntityType.toUid(modelId)
    : modelId;
  return `/data/models/edit/${uid}`;
}

export function createEnumEditLink(enumId: string): string {
  const uid = modelEnumEntityType.isId(enumId)
    ? modelEnumEntityType.toUid(enumId)
    : enumId;
  return `/data/enums/edit/${uid}`;
}
