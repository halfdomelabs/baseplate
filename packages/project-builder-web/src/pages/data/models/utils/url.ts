import { modelEntityType } from '@halfdomelabs/project-builder-lib';

export function createModelEditLink(modelId: string): string {
  const uid = modelEntityType.isId(modelId)
    ? modelEntityType.toUid(modelId)
    : modelId;
  return `/data/models/edit/${uid}`;
}
