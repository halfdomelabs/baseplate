import runMergeTests from './tests/merge.test-helper.js';
import { yamlMergeAlgorithm } from './yaml.js';

runMergeTests(yamlMergeAlgorithm, 'yaml');
