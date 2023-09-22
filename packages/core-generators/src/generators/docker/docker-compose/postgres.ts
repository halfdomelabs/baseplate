import { DockerComposeOutput } from './types.js';

interface PostgresConfig {
  port: string;
  password: string;
}

export function generatePostgresDockerCompose(
  config: PostgresConfig,
): DockerComposeOutput {
  return {
    services: [
      `  db:
    image: postgres:13.5-alpine
    restart: on-failure
    environment:
      POSTGRES_PASSWORD: ${config.password}
    ports:
      - "\${POSTGRES_PORT:-${config.port}}:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 2s
      retries: 2`,
    ],
    volumes: ['  db-data:'],
  };
}
