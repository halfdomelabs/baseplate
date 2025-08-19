import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: ['packages/*/vitest.config.js', 'plugins/*/vitest.config.js'],
    watch: false,
  },
});
