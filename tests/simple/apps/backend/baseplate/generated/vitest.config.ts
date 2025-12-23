import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    clearMocks: true,
    globalSetup: [
      './tests/scripts/global-setup-env.ts',
      './tests/scripts/global-setup-prisma.ts',
    ],
    maxWorkers: 1,
    passWithNoTests: true,
    root: './src',
  },
});
