import type { DockerComposeOutput } from './types.js';

interface PostgresConfig {
  port: string;
  password: string;
  database: string;
  projectName: string;
}

export function generatePostgresDockerCompose(
  config: PostgresConfig,
): DockerComposeOutput {
  return {
    services: [
      `  db:
    image: postgres:17.5-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName}}-db
    restart: on-failure
    security_opt:
      - no-new-privileges:true
    environment:
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-${config.password}}
      POSTGRES_DB: \${POSTGRES_DB:-${config.database}}
      POSTGRES_INITDB_ARGS: '--encoding=UTF8 --locale=en_US.utf8'
    ports:
      - "\${POSTGRES_PORT:-${config.port}}:5432"
    volumes:
      - db-data:/var/lib/postgresql/data
    networks:
      - backend
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres -d \${POSTGRES_DB:-${config.database}}"]
      interval: 5s
      timeout: 2s
      retries: 2
      start_period: 10s`,
    ],
    volumes: ['  db-data:'],
  };
}
