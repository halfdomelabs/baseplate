// Simple repository with just one backend, one admin, and one web

import { ProjectBuilderTest } from '@src/types.js';

export default {
  projectDirectory: 'simple',
  async setupEnvironment(context, helpers) {
    // disable frozen lockfile to test migrations
    await helpers.runCommand('pnpm install --no-frozen-lockfile');
    await helpers.runCommand('pnpm playwright install --with-deps', {
      cwd: 'packages/e2e',
      timeout: 180000,
    });
    await helpers.startDockerCompose(
      'packages/backend/docker/docker-compose.yml',
    );
    if (context.streamCommandOutput) {
      await helpers.runCommand('pnpm prisma migrate dev', {
        cwd: 'packages/backend',
      });
    } else {
      await helpers.runCommand('pnpm prisma migrate deploy', {
        cwd: 'packages/backend',
      });
    }
    await helpers.runCommand('pnpm prisma db seed', {
      cwd: 'packages/backend',
    });
    await helpers.startBackgroundCommand('pnpm dev', {
      waitForURL: {
        urls: ['http://localhost:3000', 'http://localhost:3001/healthz'],
      },
    });
  },
  async runTests(context, helpers) {
    await helpers.runCommand('pnpm test', {
      timeout: 60000,
    });
    await helpers.runCommand('pnpm lint');
    await helpers.runCommand('pnpm build');
  },
} satisfies ProjectBuilderTest;
