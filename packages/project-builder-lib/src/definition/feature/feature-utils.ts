import {
  FeatureConfig,
  ProjectDefinition,
  featureEntityType,
  featureNameSchema,
} from '@src/schema/index.js';

function getRootFeatures(
  projectDefinition: ProjectDefinition,
): FeatureConfig[] {
  return projectDefinition.features.filter((f) => !f.parentRef);
}

function getFeatureById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig | undefined {
  return projectDefinition.features.find((f) => f.id === featureId);
}

function getFeatureByIdOrThrow(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig {
  const feature = getFeatureById(projectDefinition, featureId);
  if (!feature) {
    throw new Error(`Could not find feature with ID ${featureId}`);
  }
  return feature;
}

function getFeatureChildren(
  projectDefinition: ProjectDefinition,
  featureId: string,
): FeatureConfig[] {
  return projectDefinition.features.filter((f) => f.parentRef === featureId);
}

function getFeatureName(featureConfig: FeatureConfig): string {
  return featureConfig.name.split('/').pop() ?? '';
}

function getFeatureNameById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectDefinition, featureId);
  return getFeatureName(feature);
}

function getFeaturePathById(
  projectDefinition: ProjectDefinition,
  featureId: string,
): string {
  const feature = getFeatureByIdOrThrow(projectDefinition, featureId);
  return feature.name;
}

function validateFeatureName(name: string): boolean {
  const nameParts = name.split('/');
  return nameParts.every((part) => featureNameSchema.safeParse(part).success);
}

function ensureFeatureByNameRecursively(
  projectDefinition: ProjectDefinition,
  nameOrId: string,
): string {
  if (featureEntityType.isUid(nameOrId)) {
    return nameOrId;
  }
  const nameParts = nameOrId.split('/');
  let lastName = '';
  let parentRef: string | null = null;
  for (const part of nameParts) {
    const feature = projectDefinition.features.find(
      (f) => f.name === part && f.parentRef === parentRef,
    );
    const name = [lastName, part].filter(Boolean).join('/');
    if (feature) {
      parentRef = feature.id;
    } else {
      const newFeature: FeatureConfig = {
        id: featureEntityType.generateNewId(),
        name,
        parentRef,
      };
      projectDefinition.features.push(newFeature);
      parentRef = newFeature.id;
    }
    lastName = name;
  }
  if (!parentRef) {
    throw new Error('Failed to create feature');
  }
  return parentRef;
}

export const FeatureUtils = {
  getRootFeatures,
  getFeatureById,
  getFeatureByIdOrThrow,
  getFeatureChildren,
  getFeatureName,
  getFeatureNameById,
  getFeaturePathById,
  validateFeatureName,
  ensureFeatureByNameRecursively,
};
