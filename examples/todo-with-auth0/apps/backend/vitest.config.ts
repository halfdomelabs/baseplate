import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  /* TPL_CONFIG:START */ {
    plugins: [tsconfigPaths()],
    test: {
      clearMocks: true,
      globalSetup: './tests/scripts/global-setup.ts',
      maxWorkers: 1,
      passWithNoTests: true,
      root: './src',
      setupFiles: ['tests/scripts/mock-redis.ts'],
    },
  } /* TPL_CONFIG:END */,
);
