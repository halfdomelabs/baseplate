import type { DockerComposeOutput } from './types.js';

interface RedisConfig {
  port: string;
  password: string;
  projectName: string;
}

export function generateRedisDockerCompose(
  config: RedisConfig,
): DockerComposeOutput {
  return {
    services: [
      `  redis:
    image: redis:8.0-alpine
    container_name: \${COMPOSE_PROJECT_NAME:-${config.projectName}}-redis
    restart: on-failure
    security_opt:
      - no-new-privileges:true
    ports:
      - "\${REDIS_PORT:-${config.port}}:6379"
    command: redis-server --save 20 1 --loglevel warning --requirepass \${REDIS_PASSWORD:-${config.password}} --maxmemory 256mb --maxmemory-policy noeviction
    volumes:
      - redis-cache:/data
    networks:
      - backend
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 2s
      retries: 2
      start_period: 10s`,
    ],
    volumes: ['  redis-cache:'],
  };
}
