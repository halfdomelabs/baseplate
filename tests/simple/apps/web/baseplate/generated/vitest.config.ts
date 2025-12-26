import { loadEnv } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    env: loadEnv('development', process.cwd(), ''),
    maxWorkers: 1,
    passWithNoTests: true,
    root: './src',
  },
});
