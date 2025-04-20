import path from 'node:path';

import { gitMergeDriverAlgorithmGenerator } from './git-merge-driver.js';
import runMergeTests from './tests/merge.test-helper.js';

const testMergeDriverPath = path.join(
  import.meta.dirname,
  'tests/git-merge-driver/test-merge-driver.js',
);

runMergeTests(
  gitMergeDriverAlgorithmGenerator({
    name: 'test',
    driver: `node ${testMergeDriverPath} %O %A %B`,
  }),
  'git-merge-driver',
);
