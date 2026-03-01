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

async function getRepoRoot(): Promise<string> {
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
  return path.dirname(rootPackageRoot);
}

export async function getTestProjectsDirectory(): Promise<string> {
  const repoRoot = await getRepoRoot();
  return path.join(repoRoot, 'tests');
}

export async function getGeneratedTestsDirectory(): Promise<string> {
  const repoRoot = await getRepoRoot();
  return path.join(repoRoot, 'generated-tests');
}
