import path from 'node:path';

import type { Logger } from '@src/utils/evented-logger.js';

import { notEmpty } from '@src/utils/arrays.js';
import { readJsonWithSchema } from '@src/utils/fs.js';

import type {
  GeneratorEntry,
  GeneratorTaskEntry,
} from './build-generator-entry.js';
import type { GeneratorConfigMap } from './loader.js';

import {
  baseDescriptorSchema,
  type BaseGeneratorDescriptor,
} from './generators.js';

interface GeneratorEntryBuilderContext {
  baseDirectory: string;
  generatorMap: GeneratorConfigMap;
  logger: Logger;
}

/**
 * Generator IDs follow the following logic:
 * + If descriptor is at the root of a file, the ID is <absolute path>
 * + Otherwise:
 *  - If descriptor is the value of a key in the children map, the ID is <parent ID>.<key>
 *  - If value of key is an array, the ID is <parent ID>.<key>.<descriptor name>
 *
 * @param descriptorOrReference The descriptor or reference of the child
 * @param baseId The ID of the parent generator
 * @param isMultiple Whether the generator is one of multiple children or just one
 */
export function getGeneratorId(
  descriptorOrReference: BaseGeneratorDescriptor | string,
  baseId: string,
  childrenMapKey: string,
  isMultiple: boolean,
): string {
  if (typeof descriptorOrReference === 'string') {
    return descriptorOrReference;
  }

  const separator = baseId.includes(':') ? '.' : ':';

  let arrayChildSuffix = '';

  if (isMultiple) {
    if (!descriptorOrReference.name) {
      throw new Error(
        `Array child generators must have a name in ${baseId} for ${childrenMapKey}`,
      );
    }
    arrayChildSuffix = `.${descriptorOrReference.name}`;
  }

  return `${baseId}${separator}${childrenMapKey}${arrayChildSuffix}`;
}

async function resolveDescriptorOrReference(
  descriptorOrReference: BaseGeneratorDescriptor | string,
  baseDirectory: string,
): Promise<BaseGeneratorDescriptor> {
  if (typeof descriptorOrReference === 'object') {
    return descriptorOrReference;
  }

  const resolvedPath = path.join(baseDirectory, descriptorOrReference);
  return readJsonWithSchema(
    `${resolvedPath}.json`,
    baseDescriptorSchema.passthrough(),
  );
}

export async function buildGeneratorEntryFromDescriptor(
  descriptor: BaseGeneratorDescriptor,
  id: string,
  context: GeneratorEntryBuilderContext,
): Promise<GeneratorEntry> {
  const generatorConfigEntry = context.generatorMap[descriptor.generator];
  if (!generatorConfigEntry) {
    throw new Error(
      `Generator ${descriptor.generator} not found in generator map`,
    );
  }
  const { config } = generatorConfigEntry;

  const { children, scopes, tasks } = config.createGenerator(descriptor, {
    id,
    generatorName: descriptor.generator,
    generatorBaseDirectory: generatorConfigEntry.directory,
    logger: context.logger,
  });

  const taskEntries = tasks.map(
    (task): GeneratorTaskEntry => ({
      id: `${id}#${task.name}`,
      dependencies: task.dependencies ?? {},
      exports: task.exports ?? {},
      task,
      generatorBaseDirectory: generatorConfigEntry.directory,
      dependentTaskIds: task.taskDependencies.map((t) => `${id}#${t}`),
      generatorName: descriptor.generator,
    }),
  );

  // recursively build children generator entries
  const childGeneratorEntryArrays = await Promise.all(
    Object.entries(children).map(async ([key, value]) => {
      const isMultiple = Array.isArray(value);
      const childDescriptorOrReferences = isMultiple ? value : [value];

      return Promise.all(
        childDescriptorOrReferences
          .filter(notEmpty)
          .map(async (descriptorOrRef) => {
            if (
              typeof descriptorOrRef === 'object' &&
              'tasks' in descriptorOrRef
            ) {
              throw new Error(`Instantiated generators not supported here`);
            }
            const childDescriptor = await resolveDescriptorOrReference(
              descriptorOrRef,
              context.baseDirectory,
            );
            const childId = getGeneratorId(
              descriptorOrRef,
              id,
              key,
              isMultiple,
            );

            return buildGeneratorEntryFromDescriptor(
              childDescriptor,
              childId,
              context,
            );
          }),
      );
    }),
  );
  const childGenerators = childGeneratorEntryArrays.flat();

  const childIds = childGenerators.map((g) => g.id);
  if (childIds.length !== new Set(childIds).size) {
    throw new Error(
      `Duplicate child generator IDs found in ${id}: ${childIds.join(', ')}`,
    );
  }

  return {
    id,
    generatorBaseDirectory: generatorConfigEntry.directory,
    scopes,
    children: childGenerators,
    tasks: taskEntries,
  };
}
