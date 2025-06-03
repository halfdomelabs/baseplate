import type { GeneratorBundle } from '@baseplate-dev/sync';

export interface AppEntry {
  id: string;
  name: string;
  appDirectory: string;
  generatorBundle: GeneratorBundle;
}
