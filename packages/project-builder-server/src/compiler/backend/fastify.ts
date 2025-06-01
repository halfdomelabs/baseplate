import type { BackendAppConfig } from '@baseplate-dev/project-builder-lib';
import type { GeneratorBundle } from '@baseplate-dev/sync';

import {
  appModuleGenerator,
  axiosGenerator,
  bullMqGenerator,
  composeFastifyApplication,
  fastifyBullBoardGenerator,
  fastifyPostmarkGenerator,
  fastifyRedisGenerator,
  fastifySentryGenerator,
  fastifyServerGenerator,
  fastifyStripeGenerator,
  pothosGenerator,
  pothosPrismaGenerator,
  pothosScalarGenerator,
  pothosSentryGenerator,
  prismaGenerator,
  prismaUtilsGenerator,
  prismaVitestGenerator,
  readmeGenerator,
  yogaPluginGenerator,
} from '@baseplate-dev/fastify-generators';
import { FeatureUtils } from '@baseplate-dev/project-builder-lib';
import { safeMergeAll } from '@baseplate-dev/utils';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { buildFeature } from './feature.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

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
      ],
    },
  });

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
        redis: app.enableRedis
          ? fastifyRedisGenerator({
              defaultUrl: getRedisSettings(projectDefinition).url,
            })
          : undefined,
        ...(app.enableBullQueue
          ? {
              bull: bullMqGenerator({}),
              bullBoard: fastifyBullBoardGenerator({}),
            }
          : {}),
        postmark: app.enablePostmark ? fastifyPostmarkGenerator({}) : undefined,
        axios: app.enableAxios ? axiosGenerator({}) : undefined,
        prisma: prismaGenerator({
          defaultDatabaseUrl: getPostgresSettings(projectDefinition).url,
        }),
        prismaVitest: prismaVitestGenerator({}),
        prismaUtils: prismaUtilsGenerator({}),
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
