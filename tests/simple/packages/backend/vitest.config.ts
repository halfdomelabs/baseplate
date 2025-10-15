import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    globalSetup: './tests/scripts/global-setup.ts',
    passWithNoTests: true,
    root: './src',
  },
});
