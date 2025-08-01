import { globby } from 'globby';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

import type { ProjectBuilderTest } from '#src/types.js';

interface TestFile {
  filename: string;
  content: ProjectBuilderTest;
}

export async function discoverTests(
  testDirectory: string,
  filter?: string,
): Promise<TestFile[]> {
  const testFiles = await globby('**.test.ts', {
    cwd: testDirectory,
    gitignore: true,
  });

  const matchingTestFiles = testFiles.filter(
    (testFile) => !filter || testFile.includes(filter),
  );

  return Promise.all(
    matchingTestFiles.map(async (testFile) => {
      const file = (await import(
        pathToFileURL(path.join(testDirectory, testFile)).href
      )) as {
        default?: ProjectBuilderTest;
      };
      if (!file.default || typeof file.default !== 'object') {
        throw new Error(
          `Test file ${testFile} does not export a valid ProjectBuilderTest object`,
        );
      }
      return {
        filename: testFile,
        content: file.default,
      };
    }),
  );
}
