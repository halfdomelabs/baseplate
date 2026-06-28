import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(
  /* TPL_CONFIG:START */ {
    resolve: { tsconfigPaths: true },
    test: {
      clearMocks: true,
      dir: 'src',
      env: loadEnv('development', process.cwd(), ''),
      maxWorkers: 1,
      passWithNoTests: true,
    },
  } /* TPL_CONFIG:END */,
);
