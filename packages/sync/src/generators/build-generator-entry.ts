import type { TaskPhase } from '@src/phases/types.js';
import type { ProviderExportScope } from '@src/providers/index.js';
import type { Logger } from '@src/utils/evented-logger.js';

import type {
  GeneratorBundle,
  GeneratorTask,
  ProviderDependencyMap,
  ProviderExportMap,
} from './generators.js';

import { findGeneratorPackageName } from './find-generator-package-name.js';

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
   * The outputs of the task entry
   */
  outputs: ProviderExportMap;
  /**
   * The task that the task entry represents
   */
  task: GeneratorTask;
  /**
   * The base directory of the generator used for loading templates
   */
  generatorBaseDirectory: string;
  /**
   * The name of the generator that the task belongs to
   */
  generatorName: string;
  /**
   * The instance name of the generator entry
   */
  instanceName?: string;
  /**
   * The phase of the task entry
   */
  phase: TaskPhase | undefined;
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

export interface BuildGeneratorEntryContext {
  logger: Logger;
}

async function buildGeneratorEntryRecursive(
  id: string,
  bundle: GeneratorBundle,
  context: BuildGeneratorEntryContext,
  packageNameCache: Map<string, string>,
): Promise<GeneratorEntry> {
  const { children, scopes, tasks, directory, name, instanceName } = bundle;

  // Get the package name for this generator
  const packageName = await findGeneratorPackageName(
    directory,
    packageNameCache,
  );
  const prefixedName = `${packageName}#${name}`;

  const taskEntries = tasks.map(
    (task): GeneratorTaskEntry => ({
      id: `${id}#${task.name}`,
      dependencies: task.dependencies ?? {},
      exports: task.exports ?? {},
      outputs: task.outputs ?? {},
      task,
      generatorBaseDirectory: directory,
      generatorName: prefixedName,
      instanceName,
      phase: task.phase,
    }),
  );

  // recursively build children generator entries
  const builtChildEntries = await Promise.all(
    Object.entries(children).map(async ([key, value]) => {
      const childId = `${id}.${key}`;

      const isMultiple = Array.isArray(value);
      const children = isMultiple ? value : [value];

      const childEntries = await Promise.all(
        children
          .filter((child) => child !== undefined)
          .map(async (child, idx) => {
            if (isMultiple && !child.instanceName) {
              throw new Error(
                `Child generator ${id}.${key}.${idx} of type ${child.name} must have an instance name if in a list of children`,
              );
            }
            const subChildId = isMultiple
              ? `${id}.${key}.${child.instanceName}`
              : childId;
            return buildGeneratorEntryRecursive(
              subChildId,
              child,
              context,
              packageNameCache,
            );
          }),
      );

      // check if any child entries have the same id
      const entryIds = childEntries.map((entry) => entry.id);
      const uniqueEntryIds = new Set(entryIds);
      if (uniqueEntryIds.size !== entryIds.length) {
        throw new Error(
          `Duplicate child generator IDs found (likely duplicate generator instance names): ${entryIds.join(', ')}`,
        );
      }

      return childEntries;
    }),
  );

  return {
    id,
    generatorBaseDirectory: directory,
    scopes,
    children: builtChildEntries.flat(),
    tasks: taskEntries,
  };
}

export async function buildGeneratorEntry(
  bundle: GeneratorBundle,
  context: BuildGeneratorEntryContext,
): Promise<GeneratorEntry> {
  const packageNameCache = new Map<string, string>();
  return buildGeneratorEntryRecursive(
    'root',
    bundle,
    context,
    packageNameCache,
  );
}
