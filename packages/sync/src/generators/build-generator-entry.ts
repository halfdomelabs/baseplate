import type { ProviderExportScope } from '@src/providers/index.js';

import {
  type GeneratorTask,
  type ProviderDependencyMap,
  type ProviderExportMap,
} from './generators.js';

/**
 * A generator task entry is a task that has been set up within a generator entry
 */
export interface GeneratorTaskEntry {
  /**
   * The unique ID of the task entry
   */
  id: string;
  /**
   * The dependencies of the task entry
   */
  dependencies: ProviderDependencyMap;
  /**
   * The exports of the task entry
   */
  exports: ProviderExportMap;
  /**
   * The task that the task entry represents
   */
  task: GeneratorTask;
  /**
   * The IDs of the tasks that this task depends on
   */
  dependentTaskIds: string[];
  /**
   * The base directory of the generator used for loading templates
   */
  generatorBaseDirectory: string;
  /**
   * The name of the generator that the task belongs to
   */
  generatorName: string;
}

/**
 * A generator entry is a representation of a generator and its children, tasks, and scopes
 */
export interface GeneratorEntry {
  /**
   * The unique ID of the entry
   */
  id: string;
  /**
   * The scopes of the generator entry
   */
  scopes: ProviderExportScope[];
  /**
   * The directory of the generator used for loading templates
   */
  generatorBaseDirectory: string;
  /**
   * The children of the generator entry
   */
  children: GeneratorEntry[];
  /**
   * The tasks of the generator entry
   */
  tasks: GeneratorTaskEntry[];
}
