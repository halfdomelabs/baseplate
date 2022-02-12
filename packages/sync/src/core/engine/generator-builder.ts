import path from 'path';
import { notEmpty } from '@src/utils/arrays';
import { BaseGeneratorDescriptor } from '../descriptor';
import { ProviderDependencyMap, ProviderExportMap } from '../generator';
import { GeneratorConfigMap, GeneratorConfigWithLocation } from '../loader';
import { loadDescriptorFromFile } from './descriptor-loader';

export interface GeneratorEntry {
  id: string;
  generatorConfig: GeneratorConfigWithLocation;
  descriptor: BaseGeneratorDescriptor;
  dependencies: ProviderDependencyMap;
  children: GeneratorEntry[];
  exports: ProviderExportMap;
}

interface GeneratorEntryBuilderContext {
  baseDirectory: string;
  generatorMap: GeneratorConfigMap;
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
  isMultiple: boolean
): string {
  if (typeof descriptorOrReference === 'string') {
    return descriptorOrReference;
  }

  const separator = baseId.includes(':') ? '.' : ':';

  let arrayChildSuffix = '';

  if (isMultiple) {
    if (!descriptorOrReference.name) {
      throw new Error(
        `Array child generators must have a name in ${baseId} for ${childrenMapKey}`
      );
    }
    arrayChildSuffix = `.${descriptorOrReference.name}`;
  }

  return `${baseId}${separator}${childrenMapKey}${arrayChildSuffix}`;
}

async function resolveDescriptorOrReference(
  descriptorOrReference: BaseGeneratorDescriptor | string,
  baseDirectory: string
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
  context: GeneratorEntryBuilderContext
): Promise<GeneratorEntry> {
  const generatorConfig = context.generatorMap[descriptor.generator];
  if (!generatorConfig) {
    throw new Error(
      `Generator ${descriptor.generator} not found in generator map`
    );
  }

  const {
    dependencies = {},
    children = {},
    validatedDescriptor,
  } = generatorConfig.parseDescriptor(descriptor, {
    generatorMap: context.generatorMap,
    id,
  });
  const { exports = {} } = generatorConfig;

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
              context.baseDirectory
            );
            const childId = getGeneratorId(
              descriptorOrRef,
              id,
              key,
              isMultiple
            );

            return buildGeneratorEntry(childDescriptor, childId, context);
          })
      );
    })
  );
  const childGenerators = childGeneratorEntryArrays.flat();

  return {
    id,
    generatorConfig,
    descriptor: validatedDescriptor || descriptor,
    dependencies,
    children: childGenerators,
    exports,
  };
}
