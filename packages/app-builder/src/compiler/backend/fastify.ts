import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildFeature } from './feature';

export function buildFastify(builder: ProjectEntryBuilder): unknown {
  const { appConfig } = builder;
  const rootFeatures =
    appConfig.features?.filter((f) => !f.includes('/')) || [];

  let authEntries = {};
  if (appConfig.auth) {
    authEntries = {
      $auth: {
        generator: '@baseplate/fastify/auth/auth',
        peerProvider: true,
      },
      $nexusAuth: {
        generator: '@baseplate/fastify/nexus/nexus-auth',
        peerProvider: true,
        authPluginRef: `${appConfig.auth.featurePath}/root:$auth.authPlugin`,
      },
    };
  }

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
      ],
    },
  });

  return {
    name: 'fastify',
    generator: '@baseplate/fastify/core/fastify',
    children: {
      server: {
        defaultPort: appConfig.portBase + 1,
      },
      $sentry: {
        generator: '@baseplate/fastify/core/fastify-sentry',
        peerProvider: true,
      },
      $prisma: {
        generator: '@baseplate/fastify/prisma/prisma',
        peerProvider: true,
        defaultPort: appConfig.portBase + 432,
      },
      $nexus: {
        generator: '@baseplate/fastify/nexus/nexus',
        peerProvider: true,
      },
      $modules: [
        ...rootFeatures.map((feature) => buildFeature(feature, builder)),
        'graphql/root',
      ],
      ...authEntries,
    },
  };
}
