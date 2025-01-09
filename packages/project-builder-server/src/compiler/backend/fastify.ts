import type { BackendAppConfig } from '@halfdomelabs/project-builder-lib';

import { FeatureUtils } from '@halfdomelabs/project-builder-lib';

import type { BackendAppEntryBuilder } from '../app-entry-builder.js';

import { buildFeature } from './feature.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

export function buildFastify(
  builder: BackendAppEntryBuilder,
  app: BackendAppConfig,
): unknown {
  const { projectDefinition, parsedProject, appCompiler } = builder;
  const rootFeatures = FeatureUtils.getRootFeatures(projectDefinition);

  // add graphql scalars
  builder.addDescriptor('graphql/root.json', {
    name: 'graphql',
    generator: '@halfdomelabs/fastify/core/app-module',
    children: {
      $schemaTypes: [
        {
          name: 'UuidScalar',
          generator: '@halfdomelabs/fastify/pothos/pothos-scalar',
          type: 'uuid',
        },
        {
          name: 'DateTimeScalar',
          generator: '@halfdomelabs/fastify/pothos/pothos-scalar',
          type: 'dateTime',
        },
        {
          name: 'DateScalar',
          generator: '@halfdomelabs/fastify/pothos/pothos-scalar',
          type: 'date',
        },
      ],
    },
  });

  return {
    name: 'fastify',
    generator: '@halfdomelabs/fastify/core/fastify',
    children: {
      server: {
        defaultPort: projectDefinition.portOffset + 1,
      },
      $readme: {
        generator: '@halfdomelabs/fastify/core/readme',
        projectName: `${projectDefinition.name} backend`,
      },
      $sentry: {
        generator: '@halfdomelabs/fastify/core/fastify-sentry',
      },
      $redis: app.enableRedis
        ? {
            generator: '@halfdomelabs/fastify/core/fastify-redis',
            defaultUrl: getRedisSettings(projectDefinition).url,
          }
        : undefined,
      ...(app.enableBullQueue
        ? {
            $bull: {
              generator: '@halfdomelabs/fastify/bull/bullmq',
            },
            $bullBoard: {
              generator: '@halfdomelabs/fastify/bull/fastify-bull-board',
            },
          }
        : {}),
      $postmark: app.enablePostmark
        ? {
            generator: '@halfdomelabs/fastify/email/fastify-postmark',
          }
        : undefined,
      $axios: app.enableAxios
        ? {
            generator: '@halfdomelabs/fastify/core/axios',
          }
        : undefined,
      $sendgrid: app.enableSendgrid
        ? {
            generator: '@halfdomelabs/fastify/email/fastify-sendgrid',
          }
        : undefined,
      $prisma: {
        generator: '@halfdomelabs/fastify/prisma/prisma',
        defaultDatabaseUrl: getPostgresSettings(projectDefinition).url,
      },
      $prismaVitest: {
        generator: '@halfdomelabs/fastify/vitest/prisma-vitest',
      },
      $prismaUtils: {
        generator: '@halfdomelabs/fastify/prisma/prisma-utils',
      },
      $yoga: {
        generator: '@halfdomelabs/fastify/yoga/yoga-plugin',
        enableSubscriptions: app.enableSubscriptions,
      },
      $pothos: {
        generator: '@halfdomelabs/fastify/pothos/pothos',
      },
      $pothosPrisma: {
        generator: '@halfdomelabs/fastify/pothos/pothos-prisma',
      },
      $pothosSentry: {
        generator: '@halfdomelabs/fastify/pothos/pothos-sentry',
      },
      $modules: [
        ...rootFeatures.map((feature) => buildFeature(feature.id, builder)),
        'graphql/root',
      ],
      $stripe: app.enableStripe
        ? {
            generator: '@halfdomelabs/fastify/stripe/fastify-stripe',
          }
        : undefined,
      ...parsedProject.fastifyChildren,
      ...appCompiler.getRootChildren(),
    },
  };
}
