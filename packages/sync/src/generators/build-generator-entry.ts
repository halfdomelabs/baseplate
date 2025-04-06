import type { TaskPhase } from '@src/phases/types.js';
import type { ProviderExportScope } from '@src/providers/index.js';
import type { Logger } from '@src/utils/evented-logger.js';

import type { GeneratorBundle, GeneratorTask } from './generators.js';

import { findGeneratorPackageName } from './find-generator-package-name.js';

export interface GeneratorInfo {
  /**
   * The name of the generator
   */
  name: string;
  /**
   * The base directory of the generator
   */
  baseDirectory: string;
  /**
   * The instance name of the generator
   */
  instanceName?: string;
}

/**
 * A generator task entry is a task that has been set up within a generator entry
 */
export interface GeneratorTaskEntry {
  /**
   * The unique ID of the task entry
   */
  id: string;
  /**
   * The name of the task entry
   */
  name: string;
  /**
   * The task that the task entry represents
   */
  task: GeneratorTask;
  /**
   * The ID of the generator that the task entry belongs to
   */
  generatorId: string;
  /**
   * The info of the generator that the task entry belongs to
   */
  generatorInfo: GeneratorInfo;
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
   * The children of the generator entry
   */
  children: GeneratorEntry[];
  /**
   * The tasks of the generator entry
   */
  tasks: GeneratorTaskEntry[];
  /**
   * The info of the generator entry
   */
  generatorInfo: GeneratorInfo;
  /**
   * The phases of the generator entry that may only contain
   * dynamic tasks and thus need to be pre-registered
   */
  preRegisteredPhases: TaskPhase[];
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
  const {
    children,
    scopes,
    tasks,
    directory,
    name,
    instanceName,
    preRegisteredPhases,
  } = bundle;

  // Get the package name for this generator
  const packageName = await findGeneratorPackageName(
    directory,
    packageNameCache,
  );
  const prefixedName = `${packageName}#${name}`;

  const generatorInfo: GeneratorInfo = {
    name: prefixedName,
    baseDirectory: directory,
    instanceName,
  };

  const taskEntries = Object.entries(tasks)
    .filter(([, task]) => task !== undefined)
    .map(([taskName, task]) => ({
      id: `${id}#${taskName}`,
      name: taskName,
      task: task as GeneratorTask,
      generatorId: id,
      generatorInfo,
    }));

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
    scopes,
    children: builtChildEntries.flat(),
    tasks: taskEntries,
    generatorInfo,
    preRegisteredPhases: preRegisteredPhases ?? [],
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
