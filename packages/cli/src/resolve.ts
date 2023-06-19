import { resolve } from 'import-meta-resolve';

export function resolveModule(moduleName: string): string {
  const moduleUrl = resolve(moduleName, import.meta.url);
  if (!moduleUrl.startsWith('file://')) {
    throw new Error(`Unable to resolve module ${moduleName} to a file`);
  }
  return moduleUrl.slice('file://'.length);
}
