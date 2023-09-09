import path from 'path';
import { notEmpty } from '@src/utils/arrays.js';
import { Logger } from '@src/utils/evented-logger.js';
import { BaseGeneratorDescriptor } from '../descriptor.js';
import {
  GeneratorTask,
  ProviderDependencyMap,
  ProviderExportMap,
} from '../generator.js';
import { GeneratorConfigMap, GeneratorConfigWithLocation } from '../loader.js';
import { loadDescriptorFromFile } from './descriptor-loader.js';

export interface GeneratorTaskEntry {
  id: string;
  dependencies: ProviderDependencyMap;
  exports: ProviderExportMap;
  task: GeneratorTask;
  generatorBaseDirectory: string;
  dependentTaskIds: string[];
  generatorName: string;
}

export interface GeneratorEntry {
  id: string;
  generatorConfig: GeneratorConfigWithLocation;
  descriptor: BaseGeneratorDescriptor;
  children: GeneratorEntry[];
  tasks: GeneratorTaskEntry[];
}

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
  return loadDescriptorFromFile(resolvedPath);
}

export async function buildGeneratorEntry(
  descriptor: BaseGeneratorDescriptor,
  id: string,
  context: GeneratorEntryBuilderContext,
): Promise<GeneratorEntry> {
  const generatorConfig = context.generatorMap[descriptor.generator];
  if (!generatorConfig) {
    throw new Error(
      `Generator ${descriptor.generator} not found in generator map`,
    );
  }

  const { children = {}, validatedDescriptor } =
    generatorConfig.parseDescriptor(descriptor, {
      generatorMap: context.generatorMap,
      id,
      logger: context.logger,
    });

  const tasks = generatorConfig
    .createGenerator(validatedDescriptor || descriptor)
    .map(
      (task): GeneratorTaskEntry => ({
        id: `${id}#${task.name}`,
        dependencies: task.dependencies || {},
        exports: task.exports || {},
        task,
        generatorBaseDirectory: generatorConfig.configBaseDirectory,
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

            return buildGeneratorEntry(childDescriptor, childId, context);
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
    generatorConfig,
    descriptor: validatedDescriptor || descriptor,
    children: childGenerators,
    tasks,
  };
}
