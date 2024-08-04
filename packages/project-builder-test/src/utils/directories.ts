import path from 'node:path';
import { packageUp } from 'package-up';

export async function getTestsDirectory(): Promise<string> {
  const packageRoot = await packageUp({
    cwd: import.meta.dirname,
  });
  if (!packageRoot) {
    throw new Error('Could not find package root');
  }
  return path.join(path.dirname(packageRoot), 'src/tests');
}

export async function getTestProjectsDirectory(): Promise<string> {
  const packageRoot = await packageUp({
    cwd: import.meta.dirname,
  });
  if (!packageRoot) {
    throw new Error('Could not find package root');
  }
  const rootPackageRoot = await packageUp({
    cwd: path.dirname(path.dirname(packageRoot)),
  });
  if (!rootPackageRoot) {
    throw new Error('Could not find root package root');
  }
  return path.join(path.dirname(rootPackageRoot), 'tests');
}
