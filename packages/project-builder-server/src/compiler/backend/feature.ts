import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  appModuleGenerator,
  auth0ModuleGenerator,
  authContextGenerator,
  authPluginGenerator,
  authRolesGenerator,
  userSessionTypesGenerator,
} from '@halfdomelabs/fastify-generators';
import { FeatureUtils, ModelUtils } from '@halfdomelabs/project-builder-lib';
import { safeMergeAll } from '@halfdomelabs/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { buildEnumsForFeature } from './enums.js';
import { buildGraphqlForFeature } from './graphql.js';
import { buildModelsForFeature } from './models.js';
import { buildServicesForFeature } from './services.js';

export function buildFeature(
  featureId: string,
  builder: BackendAppEntryBuilder,
): GeneratorBundle {
  const { projectDefinition, appCompiler } = builder;
  const feature = FeatureUtils.getFeatureByIdOrThrow(
    projectDefinition,
    featureId,
  );
  const featureName = FeatureUtils.getFeatureName(feature);
  // find sub-features
  const subFeatures = FeatureUtils.getFeatureChildren(
    projectDefinition,
    featureId,
  );

  return appModuleGenerator({
    name: featureName,
    children: safeMergeAll(
      {
        enums: buildEnumsForFeature(featureId, projectDefinition),
        models: buildModelsForFeature(builder, featureId),
        services: buildServicesForFeature(builder, featureId),
        graphql: buildGraphqlForFeature(builder, featureId),
        submodules: subFeatures.map((subFeature) =>
          buildFeature(subFeature.id, builder),
        ),
        ...(projectDefinition.auth &&
        featureId === projectDefinition.auth.authFeatureRef
          ? {
              authContext: authContextGenerator({}),
              authPlugin: authPluginGenerator({}),
              authRoles: authRolesGenerator({
                roles: projectDefinition.auth.roles.map((r) => ({
                  name: r.name,
                  comment: r.comment,
                  builtIn: r.builtIn,
                })),
              }),
              auth0Module: auth0ModuleGenerator({
                userModelName: ModelUtils.byIdOrThrow(
                  projectDefinition,
                  projectDefinition.auth.userModelRef,
                ).name,
                includeManagement: true,
              }),
              userSessionTypes: userSessionTypesGenerator({}),
            }
          : {}),
      },
      appCompiler.getChildrenForFeature(featureId),
    ),
  });
}
