import { jsonMergeAlgorithm } from './json.js';
import runMergeTests from './tests/merge.test-helper.js';

runMergeTests(jsonMergeAlgorithm, 'json', {
  formatContents: (contents) => `${contents.trimEnd()}\n`,
});
