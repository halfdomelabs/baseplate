import type {
  BackendAppConfig,
  ModelConfig,
} from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  appModuleGenerator,
  authorizerUtilsStubGenerator,
  axiosGenerator,
  composeFastifyApplication,
  dataUtilsGenerator,
  fastifyRedisGenerator,
  fastifyServerGenerator,
  pothosGenerator,
  pothosPrismaFiltersFileGenerator,
  pothosPrismaGenerator,
  pothosScalarGenerator,
  pothosSortOrderGenerator,
  prismaGenerator,
  prismaVitestGenerator,
  readmeGenerator,
  yogaPluginGenerator,
} from '@baseplate-dev/fastify-generators';
import { FeatureUtils, ModelUtils } from '@baseplate-dev/project-builder-lib';
import { safeMergeAll } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import {
  getPostgresSettings,
  getRedisSettings,
  isRedisEnabled,
} from '../infrastructure-utils.js';
import { buildFeature } from './feature.js';

export function buildFastify(
  builder: BackendAppEntryBuilder,
  app: BackendAppConfig,
): GeneratorBundle {
  const { projectDefinition, appCompiler } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);
  // Both pagination surfaces expose the same where/orderBy args, so either one
  // alone still needs the filter and sort-order helpers.
  const hasListSurface = (model: ModelConfig): boolean =>
    model.graphql.queries.list.enabled ||
    model.graphql.queries.connection.enabled;
  const hasWhereFiltering = projectDefinition.models.some(
    (model) => hasListSurface(model) && model.graphql.queries.where.enabled,
  );
  const modelIdsRequiringOrderByInput =
    ModelUtils.getModelIdsRequiringOrderByInput(projectDefinition);
  const hasOrderBy = projectDefinition.models.some(
    (model) =>
      (hasListSurface(model) && model.graphql.queries.orderBy.enabled) ||
      modelIdsRequiringOrderByInput.has(model.id) ||
      model.graphql.orderBy.defaultSort.length > 0,
  );

  // add graphql scalars
  const graphqlBundle = appModuleGenerator({
    id: 'graphql',
    name: 'graphql',
    children: {
      schemaTypes: [
        pothosScalarGenerator({ type: 'uuid' }),
        pothosScalarGenerator({ type: 'dateTime' }),
        pothosScalarGenerator({ type: 'date' }),
        pothosScalarGenerator({ type: 'json' }),
        pothosScalarGenerator({ type: 'jsonObject' }),
      ],
    },
  });

  const rootChildren = appCompiler.getRootChildren();

  return composeFastifyApplication({
    children: safeMergeAll(
      {
        fastifyServer: fastifyServerGenerator({
          defaultPort: projectDefinition.settings.general.portOffset + 1,
        }),
        readme: readmeGenerator({
          projectName: `${projectDefinition.settings.general.name} backend`,
        }),
        redis: isRedisEnabled(projectDefinition)
          ? fastifyRedisGenerator({
              defaultUrl: getRedisSettings(projectDefinition).url,
            })
          : undefined,
        axios: app.enableAxios ? axiosGenerator({}) : undefined,
        prisma: prismaGenerator({
          defaultDatabaseUrl: getPostgresSettings(projectDefinition).url,
        }),
        prismaVitest: prismaVitestGenerator({}),
        dataUtils: dataUtilsGenerator({}),
        ...('authorizerUtils' in rootChildren
          ? {}
          : { authorizerUtils: authorizerUtilsStubGenerator({}) }),
        yoga: yogaPluginGenerator({
          enableSubscriptions: app.enableSubscriptions,
        }),
        pothos: pothosGenerator({}),
        pothosPrisma: pothosPrismaGenerator({}),
        pothosPrismaFilters: hasWhereFiltering
          ? pothosPrismaFiltersFileGenerator({})
          : undefined,
        pothosSortOrder: hasOrderBy ? pothosSortOrderGenerator({}) : undefined,
        modules: [
          ...rootFeatures.map((feature) => buildFeature(feature.id, builder)),
          graphqlBundle,
        ],
      },
      appCompiler.getRootChildren(),
    ),
  });
}
