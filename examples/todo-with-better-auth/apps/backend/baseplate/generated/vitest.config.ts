import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  /* TPL_CONFIG:START */ {
    resolve: { tsconfigPaths: true },
    test: {
      clearMocks: true,
      dir: 'src',
      env: loadEnv('development', process.cwd(), ''),
      globalSetup: ['src/tests/scripts/global-setup-prisma.ts'],
      maxWorkers: process.env.TEST_MODE === 'unit' ? undefined : 8,
      passWithNoTests: true,
      setupFiles: [
        'src/tests/scripts/setup-db.ts',
        'src/tests/scripts/setup-redis.ts',
      ],
      testTimeout: 15_000,
    },
  } /* TPL_CONFIG:END */,
);
