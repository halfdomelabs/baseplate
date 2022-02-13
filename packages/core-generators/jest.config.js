const sharedConfig = require('@baseplate/tools/jest.config.ts');

module.exports = {
  ...sharedConfig,
  roots: ['<rootDir>/src/'],
};
