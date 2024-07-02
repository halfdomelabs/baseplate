import {
  FeatureUtils,
  BackendAppConfig,
} from '@halfdomelabs/project-builder-lib';

import { buildFeature } from './feature.js';
import { getPostgresSettings, getRedisSettings } from './utils.js';
import { BackendAppEntryBuilder } from '../appEntryBuilder.js';

export function buildFastify(
  builder: BackendAppEntryBuilder,
  app: BackendAppConfig,
): unknown {
  const { projectDefinition, parsedProject } = builder;
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
        peerProvider: true,
        projectName: `${projectDefinition.name} backend`,
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
            defaultUrl: getRedisSettings(projectDefinition).url,
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
      $axios: !app.enableAxios
        ? undefined
        : {
            generator: '@halfdomelabs/fastify/core/axios',
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
        defaultDatabaseUrl: getPostgresSettings(projectDefinition).url,
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
        ...rootFeatures.map((feature) => buildFeature(feature.id, builder)),
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
