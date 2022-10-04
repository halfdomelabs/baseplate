import { BackendAppConfig } from '@src/schema';
import { AppEntryBuilder } from '../appEntryBuilder';
import { buildFeature } from './feature';
import { getPostgresSettings, getRedisSettings } from './utils';

export function buildFastify(
  builder: AppEntryBuilder,
  app: BackendAppConfig
): unknown {
  const { projectConfig, parsedProject } = builder;
  const rootFeatures =
    projectConfig.features?.filter((f) => !f.name.includes('/')) || [];

  // add graphql scalars
  builder.addDescriptor('graphql/root.json', {
    name: 'graphql',
    generator: '@baseplate/fastify/core/app-module',
    children: {
      $schemaTypes: [
        {
          name: 'UuidScalar',
          generator: '@baseplate/fastify/nexus/nexus-scalar',
          type: 'uuid',
        },
        {
          name: 'DateTimeScalar',
          generator: '@baseplate/fastify/nexus/nexus-scalar',
          type: 'dateTime',
        },
        {
          name: 'DateScalar',
          generator: '@baseplate/fastify/nexus/nexus-scalar',
          type: 'date',
        },
      ],
    },
  });

  return {
    name: 'fastify',
    generator: '@baseplate/fastify/core/fastify',
    children: {
      server: {
        defaultPort: projectConfig.portBase + 1,
      },
      $sentry: {
        generator: '@baseplate/fastify/core/fastify-sentry',
        peerProvider: true,
      },
      $redis: !app.enableRedis
        ? undefined
        : {
            generator: '@baseplate/fastify/core/fastify-redis',
            peerProvider: true,
            defaultUrl: getRedisSettings(projectConfig).url,
          },
      $bull: !app.enableBullQueue
        ? undefined
        : {
            generator: '@baseplate/fastify/bull/bullmq',
            peerProvider: true,
          },
      $postmark: !app.enablePostmark
        ? undefined
        : {
            generator: '@baseplate/fastify/email/fastify-postmark',
            peerProvider: true,
          },
      $sendgrid: !app.enableSendgrid
        ? undefined
        : {
            generator: '@baseplate/fastify/email/fastify-sendgrid',
            peerProvider: true,
          },
      $prisma: {
        generator: '@baseplate/fastify/prisma/prisma',
        peerProvider: true,
        defaultDatabaseUrl: getPostgresSettings(projectConfig).url,
      },
      $prismaJest: {
        generator: '@baseplate/fastify/jest/prisma-jest',
        peerProvider: true,
      },
      $prismaUtils: {
        generator: '@baseplate/fastify/prisma/prisma-utils',
        peerProvider: true,
      },
      $nexus: {
        generator: '@baseplate/fastify/nexus/nexus',
        enableSubscriptions: app.enableSubscriptions,
        peerProvider: true,
      },
      $yogaSentry: {
        generator: '@baseplate/fastify/nexus/yoga-sentry',
      },
      $modules: [
        ...rootFeatures.map((feature) => buildFeature(feature.name, builder)),
        'graphql/root',
      ],
      $stripe: !app.enableStripe
        ? undefined
        : {
            generator: '@baseplate/fastify/stripe/fastify-stripe',
            peerProvider: true,
          },
      ...parsedProject.fastifyChildren,
    },
  };
}
