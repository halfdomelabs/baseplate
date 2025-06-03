import { findNearestPackageJson } from '@baseplate-dev/utils/node';
import path from 'node:path';

export async function getTestsDirectory(): Promise<string> {
  const packageRoot = await findNearestPackageJson({
    cwd: import.meta.dirname,
  });
  if (!packageRoot) {
    throw new Error('Could not find package root');
  }
  return path.join(path.dirname(packageRoot), 'src/tests');
}

export async function getTestProjectsDirectory(): Promise<string> {
  const packageRoot = await findNearestPackageJson({
    cwd: import.meta.dirname,
  });
  if (!packageRoot) {
    throw new Error('Could not find package root');
  }
  const rootPackageRoot = await findNearestPackageJson({
    cwd: path.dirname(path.dirname(packageRoot)),
  });
  if (!rootPackageRoot) {
    throw new Error('Could not find root package root');
  }
  return path.join(path.dirname(rootPackageRoot), 'tests');
}
