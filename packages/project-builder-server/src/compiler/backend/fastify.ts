import type { BackendAppConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  appModuleGenerator,
  authorizerUtilsStubGenerator,
  axiosGenerator,
  composeFastifyApplication,
  dataUtilsGenerator,
  fastifyRedisGenerator,
  fastifySentryGenerator,
  fastifyServerGenerator,
  fastifyStripeGenerator,
  pothosGenerator,
  pothosPrismaGenerator,
  pothosScalarGenerator,
  pothosSentryGenerator,
  prismaGenerator,
  prismaVitestGenerator,
  readmeGenerator,
  yogaPluginGenerator,
} from '@baseplate-dev/fastify-generators';
import { FeatureUtils } from '@baseplate-dev/project-builder-lib';
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
        sentry: fastifySentryGenerator({}),
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
        pothosSentry: pothosSentryGenerator({}),
        modules: [
          ...rootFeatures.map((feature) => buildFeature(feature.id, builder)),
          graphqlBundle,
        ],
        stripe: app.enableStripe ? fastifyStripeGenerator({}) : undefined,
      },
      appCompiler.getRootChildren(),
    ),
  });
}
