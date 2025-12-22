import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { defineConfig, env } from 'prisma/config';

// Only load .env file if it exists
if (existsSync('.env')) {
  loadEnvFile();
}

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrations: {
    path: './prisma/migrations',
    seed: 'tsx --env-file-if-exists=.env --env-file-if-exists=.seed.env src/prisma/seed.ts',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
