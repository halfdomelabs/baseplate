import { fileURLToPath } from 'node:url';

export function resolveModule(moduleName: string): string {
  const moduleUrl = import.meta.resolve(moduleName);
  if (!moduleUrl.startsWith('file://')) {
    throw new Error(`Unable to resolve module ${moduleName} to a file`);
  }
  return fileURLToPath(moduleUrl);
}
