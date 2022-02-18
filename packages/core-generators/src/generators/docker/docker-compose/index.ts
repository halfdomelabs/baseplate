import path from 'path';
import { createGeneratorWithChildren } from '@baseplate/sync';
import * as yup from 'yup';
import { projectProvider } from '../../../providers';
import { generatePostgresDockerCompose } from './postgres';
import { DockerComposeOutput } from './types';

const descriptorSchema = yup.object({
  projectName: yup.string(),
  dockerFolder: yup.string().default('docker'),
  postgres: yup
    .object({
      port: yup.string().default('5432'),
      password: yup.string(),
    })
    .default(undefined),
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
    } = descriptor;

    const outputs: DockerComposeOutput[] = [];

    if (postgres) {
      outputs.push(
        generatePostgresDockerCompose({
          port: postgres.port,
          password: postgres.password || `${projectName}-password`,
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

${entries.join('\n')}`.trim()}\n`
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
