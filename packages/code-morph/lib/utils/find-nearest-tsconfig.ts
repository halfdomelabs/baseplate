import * as fs from 'fs';
import * as path from 'path';

export function findNearestTsconfig(startPath: string): string | undefined {
  let currentPath = startPath;

  for (;;) {
    const tsconfigPath = path.join(currentPath, 'tsconfig.json');

    if (fs.existsSync(tsconfigPath)) {
      return tsconfigPath;
    }

    const parentPath = path.dirname(currentPath);

    if (parentPath === currentPath) {
      // Reached the root directory without finding tsconfig.json
      return undefined;
    }

    currentPath = parentPath;
  }
}
