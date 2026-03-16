import type {
  FeatureConfig,
  PartialProjectDefinitionInput,
  ProjectDefinition,
} from '#src/schema/index.js';

import { featureEntityType, featureNameSchema } from '#src/schema/index.js';

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
  if (featureEntityType.isId(nameOrId)) {
    return nameOrId;
  }
  const nameParts = nameOrId.split('/');
  let lastName = '';
  let parentRef: string | undefined = undefined;
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

function createPartialFeatures(
  nameOrPath: string,
): NonNullable<PartialProjectDefinitionInput['features']> {
  if (!nameOrPath) return [];
  const parts = nameOrPath.split('/');
  return parts.map((_, i) => {
    const name = parts.slice(0, i + 1).join('/');
    const parentRef = i > 0 ? parts.slice(0, i).join('/') : undefined;
    return { name, parentRef };
  });
}

function getFeatureByName(
  projectDefinition: ProjectDefinition,
  name: string,
): FeatureConfig | undefined {
  return projectDefinition.features.find((f) => f.name === name);
}

function getFeatureIdByNameOrThrow(
  projectDefinition: ProjectDefinition,
  name: string,
): string {
  const feature = getFeatureByName(projectDefinition, name);
  if (!feature) {
    throw new Error(`Could not find feature with name ${name}`);
  }
  return feature.id;
}

function getFeatureIdByNameOrDefault(
  projectDefinition: ProjectDefinition,
  name: string,
): string {
  return getFeatureByName(projectDefinition, name)?.id ?? name;
}

function resolveFeatureName(
  projectDefinition: ProjectDefinition,
  featureRef: string | null | undefined,
): string {
  if (!featureRef) return '';
  if (featureEntityType.isId(featureRef)) {
    return getFeaturePathById(projectDefinition, featureRef);
  }
  return featureRef;
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
  createPartialFeatures,
  getFeatureByName,
  getFeatureIdByNameOrThrow,
  getFeatureIdByNameOrDefault,
  resolveFeatureName,
};
