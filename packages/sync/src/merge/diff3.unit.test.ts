import { diff3MergeAlgorithm } from './diff3.js';
import runMergeTests from './tests/merge.test-helper.js';

runMergeTests(diff3MergeAlgorithm, 'diff3');
