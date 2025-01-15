import type { GeneratorBundle } from '@halfdomelabs/sync';

export interface AppEntry {
  name: string;
  appDirectory: string;
  generatorBundle: GeneratorBundle;
}
