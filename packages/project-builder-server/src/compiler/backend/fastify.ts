import type { BackendAppConfig } from '@halfdomelabs/project-builder-lib';
import type { GeneratorBundle } from '@halfdomelabs/sync';

import {
  appModuleGenerator,
  authGenerator,
  axiosGenerator,
  bullMqGenerator,
  composeFastifyApplication,
  fastifyBullBoardGenerator,
  fastifyPostmarkGenerator,
  fastifyRedisGenerator,
  fastifySendgridGenerator,
  fastifySentryGenerator,
  fastifyServerGenerator,
  fastifyStripeGenerator,
  pothosAuthGenerator,
  pothosGenerator,
  pothosPrismaGenerator,
  pothosScalarGenerator,
  pothosSentryGenerator,
  prismaGenerator,
  prismaUtilsGenerator,
  prismaVitestGenerator,
  readmeGenerator,
  yogaPluginGenerator,
} from '@halfdomelabs/fastify-generators';
import { FeatureUtils } from '@halfdomelabs/project-builder-lib';
import { safeMergeAll } from '@halfdomelabs/utils';

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
          defaultPort: projectDefinition.portOffset + 1,
        }),
        readme: readmeGenerator({
          projectName: `${projectDefinition.name} backend`,
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
        sendgrid: app.enableSendgrid ? fastifySendgridGenerator({}) : undefined,
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
        ...(projectDefinition.auth
          ? {
              auth: authGenerator({}),
              pothosAuth: pothosAuthGenerator({}),
            }
          : {}),
      },
      appCompiler.getRootChildren(),
    ),
  });
}
