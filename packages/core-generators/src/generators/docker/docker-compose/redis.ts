import type { DockerComposeOutput } from './types.js';

interface PostgresConfig {
  port: string;
  password: string;
}

export function generateRedisDockerCompose(
  config: PostgresConfig,
): DockerComposeOutput {
  return {
    services: [
      `  redis:
    image: redis:7.2.4-alpine
    restart: on-failure
    ports:
      - "\${REDIS_PORT:-${config.port}}:6379"
    command: redis-server -- save 20 1 --loglevel warning --requirepass ${config.password}
    volumes:
      - redis-cache:/data
    healthcheck:
      test: [ "CMD", "redis-cli", "ping" ]  
      interval: 5s
      timeout: 2s
      retries: 2`,
    ],
    volumes: ['  redis-cache:'],
  };
}
