const sharedConfig = require('@baseplate/tools/jest.config.ts');
const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig.json');

module.exports = {
  ...sharedConfig,
  roots: ['<rootDir>/src/'],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: '<rootDir>/',
  }),
};
