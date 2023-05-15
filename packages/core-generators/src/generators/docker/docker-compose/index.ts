import path from 'path';
import { createGeneratorWithChildren } from '@halfdomelabs/sync';
import { z } from 'zod';
import { projectProvider } from '../../../providers';
import { generatePostgresDockerCompose } from './postgres';
import { generateRedisDockerCompose } from './redis';
import { DockerComposeOutput } from './types';

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
          password: postgres.password || `${projectName}-password`,
        })
      );
    }

    if (redis) {
      outputs.push(
        generateRedisDockerCompose({
          port: redis.port.toString(),
          password: redis.password || `${projectName}-password`,
        })
      );
    }

    const dockerComposePath = path.join(dockerFolder, 'docker-compose.yml');
    const dockerEnvPath = path.join(dockerFolder, '.env');

    const serviceEntries = outputs.map((output) => output.services).flat();
    const volumeEntries = outputs.map((output) => output.volumes).flat();

    const services = `
services:
${serviceEntries.join('\n')}`.trim();

    const volumes = `
volumes:
${volumeEntries.join('\n')}`.trim();

    const entries = [
      ...(serviceEntries.length ? [services] : []),
      ...(volumeEntries.length ? [volumes] : []),
    ];

    if (!serviceEntries.length) {
      throw new Error('No services defined for Docker Compose file');
    }

    return {
      getProviders: () => ({}),
      build: (builder) => {
        builder.writeFile(
          dockerComposePath,
          `${`
version: '3.9'

${entries.join('\n')}`.trim()}\n`,
          { shouldFormat: true }
        );

        builder.writeFile(
          dockerEnvPath,
          `COMPOSE_PROJECT_NAME=${projectName}-dev\n`
        );
      },
    };
  },
});

export default DockerComposeGenerator;
