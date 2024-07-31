// Simple repository with just one backend, one admin, and one web

import { ProjectBuilderTest } from '@src/types.js';

export default {
  projectDirectory: 'simple',
  async runTests() {
    // This is a simple test suite that always passes
  },
} satisfies ProjectBuilderTest;
