import type { GeneratorBundle } from '@halfdomelabs/sync';

/**
 * @deprecated
 */
export interface FileEntry {
  path: string;
  jsonContent: unknown;
}

export interface AppEntry {
  name: string;
  appDirectory: string;
  generatorBundle: GeneratorBundle;
}
