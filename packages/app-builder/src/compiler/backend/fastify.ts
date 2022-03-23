import { ProjectEntryBuilder } from '../projectEntryBuilder';
import { buildFeature } from './feature';

export function buildFastify(builder: ProjectEntryBuilder): unknown {
  const { appConfig } = builder;
  const rootFeatures =
    appConfig.features?.filter((f) => !f.includes('/')) || [];
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
      $modules: rootFeatures.map((feature) => buildFeature(feature, builder)),
    },
  };
}
