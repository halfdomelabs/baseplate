// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

module.exports = {
  preset: 'ts-jest',

  // Automatically clear mock calls and instances between every test
  clearMocks: true,

  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: false,

  // An array of glob patterns indicating a set of files for which coverage information should be collected
  collectCoverageFrom: ['src/**/*.{js,jsx,ts,tsx}', '!src/**/*.d.ts'],

  testPathIgnorePatterns: ['/dist/', '/lib/', '/node_modules/'],

  // The test environment that will be used for testing
  testEnvironment: 'node',

  roots: ['<rootDir>/src/', '<rootDir>/tests/'],
};
