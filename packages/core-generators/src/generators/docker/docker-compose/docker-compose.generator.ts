import { createGenerator, createGeneratorTask } from '@baseplate-dev/sync';
import path from 'node:path';
import { z } from 'zod';

import type { DockerComposeOutput } from './types.js';

import { packageInfoProvider } from '../../../providers/index.js';
import { generatePostgresDockerCompose } from './postgres.js';
import { generateRedisDockerCompose } from './redis.js';

const descriptorSchema = z.object({
  projectName: z.string().optional(),
  dockerFolder: z.string().default('docker'),
  postgres: z
    .object({
      port: z.number().default(5432),
      password: z.string().optional(),
      database: z.string().optional(),
    })
    .nullish(),
  redis: z
    .object({
      port: z.number().default(6379),
      password: z.string().optional(),
    })
    .nullish(),
});

export const dockerComposeGenerator = createGenerator({
  name: 'docker/docker-compose',
  generatorFileUrl: import.meta.url,
  descriptorSchema,
  buildTasks: (descriptor) => ({
    main: createGeneratorTask({
      dependencies: {
        packageInfo: packageInfoProvider,
      },
      run({ packageInfo }) {
        const {
          projectName = packageInfo.getPackageName(),
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
              database: postgres.database ?? projectName,
              projectName,
            }),
          );
        }

        if (redis) {
          outputs.push(
            generateRedisDockerCompose({
              port: redis.port.toString(),
              password: redis.password ?? `${projectName}-password`,
              projectName,
            }),
          );
        }

        const dockerComposePath = path.join(dockerFolder, 'docker-compose.yml');
        const dockerEnvPath = path.join(dockerFolder, '.env');
        const dockerEnvExamplePath = path.join(dockerFolder, '.env.example');

        const serviceEntries = outputs.flatMap((output) => output.services);
        const volumeEntries = outputs.flatMap((output) => output.volumes);

        const services = `
services:
${serviceEntries.join('\n')}`.trim();

        const volumes = `
volumes:
${volumeEntries.join('\n')}`.trim();

        const networks = `
networks:
  backend:
    driver: bridge`.trim();

        const entries = [
          ...(serviceEntries.length > 0 ? [services] : []),
          ...(volumeEntries.length > 0 ? [volumes] : []),
          ...(serviceEntries.length > 0 ? [networks] : []), // Add network if we have services
        ];

        if (serviceEntries.length === 0) {
          throw new Error('No services defined for Docker Compose file');
        }

        // Generate environment variable documentation
        const envVars = [`COMPOSE_PROJECT_NAME=${projectName}-dev`];
        const envExampleVars = [
          '# Docker Compose Project Configuration',
          `COMPOSE_PROJECT_NAME=${projectName}-dev`,
          '',
        ];

        if (postgres) {
          envVars.push(
            `POSTGRES_PORT=${postgres.port}`,
            `POSTGRES_PASSWORD=${postgres.password ?? `${projectName}-password`}`,
            `POSTGRES_DB=${postgres.database ?? projectName}`,
          );
          envExampleVars.push(
            '# PostgreSQL Configuration',
            `POSTGRES_PORT=${postgres.port}`,
            `POSTGRES_PASSWORD=${postgres.password ?? `${projectName}-password`}`,
            `POSTGRES_DB=${postgres.database ?? projectName}`,
            '',
          );
        }

        if (redis) {
          envVars.push(
            `REDIS_PORT=${redis.port}`,
            `REDIS_PASSWORD=${redis.password ?? `${projectName}-password`}`,
          );
          envExampleVars.push(
            '# Redis Configuration',
            `REDIS_PORT=${redis.port}`,
            `REDIS_PASSWORD=${redis.password ?? `${projectName}-password`}`,
            '',
          );
        }

        return {
          build: (builder) => {
            builder.writeFile({
              id: 'docker-compose',
              destination: dockerComposePath,
              contents: `${`
${entries.join('\n')}`.trim()}\n`,
            });

            builder.writeFile({
              id: 'docker-env',
              destination: dockerEnvPath,
              contents: `${envVars.join('\n')}\n`,
            });

            builder.writeFile({
              id: 'docker-env-example',
              destination: dockerEnvExamplePath,
              contents: `${envExampleVars.join('\n')}\n`,
            });
          },
        };
      },
    }),
  }),
});
