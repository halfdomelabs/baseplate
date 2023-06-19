const { default: tsconfigPaths } = require('vite-tsconfig-paths');
const { defineConfig } = require('vitest/config');

module.exports = defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    watch: false,
    root: './src',
    deps: {
      inline: ['globby'],
    },
    mockReset: true,
  },
});
