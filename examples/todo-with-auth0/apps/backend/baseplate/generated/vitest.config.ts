import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  /* TPL_CONFIG:START */ {
    plugins: [tsconfigPaths()],
    test: {
      clearMocks: true,
      env: loadEnv('development', process.cwd(), ''),
      globalSetup: [
        'src/tests/scripts/global-setup-prisma.ts',
        'src/tests/scripts/global-setup-redis.ts',
      ],
      maxWorkers: 1,
      passWithNoTests: true,
    },
  } /* TPL_CONFIG:END */,
);
