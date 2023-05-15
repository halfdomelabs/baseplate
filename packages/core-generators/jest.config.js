const sharedConfig = require('@halfdomelabs/tools/jest.config.ts');

module.exports = {
  ...sharedConfig,
  roots: ['<rootDir>/src/'],
};
