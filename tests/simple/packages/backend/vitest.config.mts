import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    globalSetup: './src/tests/scripts/global-setup.ts',
    passWithNoTests: true,
    root: './src',
  },
});
