import type { GeneratorBundle } from '@halfdomelabs/sync';

export interface AppEntry {
  id: string;
  name: string;
  appDirectory: string;
  generatorBundle: GeneratorBundle;
}
