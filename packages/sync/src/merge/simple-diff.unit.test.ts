import { simpleDiffAlgorithm } from './simple-diff.js';
import runMergeTests from './tests/merge.test-helper.js';

runMergeTests(simpleDiffAlgorithm, 'simple-diff');
