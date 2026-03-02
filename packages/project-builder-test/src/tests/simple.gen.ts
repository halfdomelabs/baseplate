// Simple repository with just one backend, one admin, and one web

import type { ProjectBuilderTest } from '@baseplate-dev/project-builder-dev/e2e-runner';

export default {
  projectDirectory: 'simple',
  async setupEnvironment(context, helpers) {
    await helpers.runCommand('pnpm install');
    await helpers.startDockerCompose('docker/docker-compose.yml');
    await (context.streamCommandOutput
      ? helpers.runCommand('pnpm prisma migrate dev', {
          cwd: 'apps/backend',
        })
      : helpers.runCommand('pnpm prisma migrate deploy', {
          cwd: 'apps/backend',
        }));
    await helpers.runCommand('pnpm prisma db seed', {
      cwd: 'apps/backend',
    });
    await helpers.startBackgroundCommand('pnpm dev', {
      waitForURL: {
        urls: ['http://localhost:3030', 'http://localhost:3001/healthz'],
      },
    });
  },
  async runTests(context, helpers) {
    await helpers.runCommand('pnpm test', {
      timeout: 60_000,
    });
    await helpers.runCommand('pnpm lint');
    await helpers.runCommand('pnpm prettier:check');
    await helpers.runCommand('pnpm build');
  },
} satisfies ProjectBuilderTest;
