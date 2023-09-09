import { BackendAppConfig } from '@src/schema/index.js';
import { AppEntryBuilder } from '../appEntryBuilder.js';
import { buildFeature } from './feature.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';

export function buildFastify(
  builder: AppEntryBuilder,
  app: BackendAppConfig,
): unknown {
  const { projectConfig, parsedProject } = builder;
  const rootFeatures =
    projectConfig.features?.filter((f) => !f.name.includes('/')) || [];

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
        defaultPort: projectConfig.portOffset + 1,
      },
      $sentry: {
        generator: '@halfdomelabs/fastify/core/fastify-sentry',
        peerProvider: true,
      },
      $redis: !app.enableRedis
        ? undefined
        : {
            generator: '@halfdomelabs/fastify/core/fastify-redis',
            peerProvider: true,
            defaultUrl: getRedisSettings(projectConfig).url,
          },
      ...(!app.enableBullQueue
        ? {}
        : {
            $bull: {
              generator: '@halfdomelabs/fastify/bull/bullmq',
              peerProvider: true,
            },
            $bullBoard: {
              generator: '@halfdomelabs/fastify/bull/fastify-bull-board',
              peerProvider: true,
            },
          }),
      $postmark: !app.enablePostmark
        ? undefined
        : {
            generator: '@halfdomelabs/fastify/email/fastify-postmark',
            peerProvider: true,
          },
      $sendgrid: !app.enableSendgrid
        ? undefined
        : {
            generator: '@halfdomelabs/fastify/email/fastify-sendgrid',
            peerProvider: true,
          },
      $prisma: {
        generator: '@halfdomelabs/fastify/prisma/prisma',
        peerProvider: true,
        defaultDatabaseUrl: getPostgresSettings(projectConfig).url,
      },
      $prismaJest: {
        generator: '@halfdomelabs/fastify/jest/prisma-jest',
        peerProvider: true,
      },
      $prismaUtils: {
        generator: '@halfdomelabs/fastify/prisma/prisma-utils',
        peerProvider: true,
      },
      $yoga: {
        generator: '@halfdomelabs/fastify/yoga/yoga-plugin',
        enableSubscriptions: app.enableSubscriptions,
        peerProvider: true,
      },
      $pothos: {
        generator: '@halfdomelabs/fastify/pothos/pothos',
        peerProvider: true,
      },
      $pothosPrisma: {
        generator: '@halfdomelabs/fastify/pothos/pothos-prisma',
      },
      $yogaSentry: {
        generator: '@halfdomelabs/fastify/yoga/yoga-sentry',
      },
      $modules: [
        ...rootFeatures.map((feature) => buildFeature(feature.name, builder)),
        'graphql/root',
      ],
      $stripe: !app.enableStripe
        ? undefined
        : {
            generator: '@halfdomelabs/fastify/stripe/fastify-stripe',
            peerProvider: true,
          },
      ...parsedProject.fastifyChildren,
    },
  };
}
