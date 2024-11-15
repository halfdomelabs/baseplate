import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import path from 'node:path';
import { z } from 'zod';

import type { DockerComposeOutput } from './types.js';

import { projectProvider } from '../../../providers/index.js';
import { generatePostgresDockerCompose } from './postgres.js';
import { generateRedisDockerCompose } from './redis.js';

const descriptorSchema = z.object({
  projectName: z.string().optional(),
  dockerFolder: z.string().default('docker'),
  postgres: z
    .object({
      port: z.number().default(5432),
      password: z.string().optional(),
    })
    .nullish(),
  redis: z
    .object({
      port: z.number().default(6379),
      password: z.string().optional(),
    })
    .nullish(),
});

const DockerComposeGenerator = createGeneratorWithChildren({
  descriptorSchema,
  getDefaultChildGenerators: () => ({}),
  dependencies: {
    project: projectProvider,
  },
  createGenerator(descriptor, { project }) {
    const {
      projectName = project.getProjectName(),
      dockerFolder,
      postgres,
      redis,
    } = descriptor;

    const outputs: DockerComposeOutput[] = [];

    if (postgres) {
      outputs.push(
        generatePostgresDockerCompose({
          port: postgres.port.toString(),
          password: postgres.password ?? `${projectName}-password`,
        }),
      );
    }

    if (redis) {
      outputs.push(
        generateRedisDockerCompose({
          port: redis.port.toString(),
          password: redis.password ?? `${projectName}-password`,
        }),
      );
    }

    const dockerComposePath = path.join(dockerFolder, 'docker-compose.yml');
    const dockerEnvPath = path.join(dockerFolder, '.env');

    const serviceEntries = outputs.flatMap((output) => output.services);
    const volumeEntries = outputs.flatMap((output) => output.volumes);

    const services = `
services:
${serviceEntries.join('\n')}`.trim();

    const volumes = `
volumes:
${volumeEntries.join('\n')}`.trim();

    const entries = [
      ...(serviceEntries.length > 0 ? [services] : []),
      ...(volumeEntries.length > 0 ? [volumes] : []),
    ];

    if (serviceEntries.length === 0) {
      throw new Error('No services defined for Docker Compose file');
    }

    return {
      getProviders: () => ({}),
      build: (builder) => {
        builder.writeFile(
          dockerComposePath,
          `${`
${entries.join('\n')}`.trim()}\n`,
          { shouldFormat: true },
        );

        builder.writeFile(
          dockerEnvPath,
          `COMPOSE_PROJECT_NAME=${projectName}-dev\n`,
        );
      },
    };
  },
});

export default DockerComposeGenerator;
