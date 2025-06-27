// Simple repository with just one backend, one admin, and one web

import type { ProjectBuilderTest } from '#src/types.js';

export default {
  projectDirectory: 'simple',
  async setupEnvironment(context, helpers) {
    // disable frozen lockfile to test migrations
    await helpers.runCommand('pnpm install --no-frozen-lockfile');
    await helpers.startDockerCompose(
      'packages/backend/docker/docker-compose.yml',
    );
    await (context.streamCommandOutput
      ? helpers.runCommand('pnpm prisma migrate dev', {
          cwd: 'packages/backend',
        })
      : helpers.runCommand('pnpm prisma migrate deploy', {
          cwd: 'packages/backend',
        }));
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
      timeout: 60_000,
    });
    await helpers.runCommand('pnpm lint');
    // TODO: Fix prettier due to weird bug that only happens on CI
    // await helpers.runCommand('pnpm prettier:check');
    await helpers.runCommand('pnpm build');
  },
} satisfies ProjectBuilderTest;
