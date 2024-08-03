import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    root: './src',
    globalSetup: './src/tests/scripts/globalSetup.ts',
  },
});
