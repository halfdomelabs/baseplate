import * as R from 'ramda';
import { z } from 'zod';
import {
  baseDescriptorSchema,
  BaseGeneratorDescriptor,
  GeneratorConfig,
  GeneratorTaskInstance,
  InferDependencyProviderMap,
  InferExportProviderMap,
  ProviderDependencyMap,
  ProviderExportMap,
} from '../core/index.js';
import { notEmpty } from './arrays.js';
import {
  ChildGeneratorConfig,
  DescriptorWithChildren,
} from './createGeneratorTypes.js';

export interface SimpleGeneratorConfig<
  DescriptorSchema extends z.ZodType,
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap,
> {
  descriptorSchema?: DescriptorSchema;
  getDefaultChildGenerators?(
    descriptor: z.infer<DescriptorSchema>,
  ): Record<string, ChildGeneratorConfig>;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  // we need a separate function because we can't infer the type of the
  // dependency map from a generator function that takes in a generic descriptor
  populateDependencies?: (
    dependencyMap: DependencyMap,
    descriptor: z.infer<DescriptorSchema>,
  ) => ProviderDependencyMap;
  createGenerator: (
    descriptor: DescriptorWithChildren & z.infer<DescriptorSchema>,
    dependencies: InferDependencyProviderMap<DependencyMap>,
  ) => GeneratorTaskInstance<InferExportProviderMap<ExportMap>>;
}

/**
 * Helper utility to create a generator with a standard format for customizable children
 *
 * getDefaultChildGenerators will return a map of valid child generators
 * Consumers can customize children via the children property in the descriptor.
 * They can prefix the key with a $ to add custom children that aren't specified in the config.
 *
 * @param config Configuration of the generator
 * @returns Normal generator
 */
export function createGeneratorWithChildren<
  DescriptorSchema extends z.ZodType,
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap,
>(
  config: SimpleGeneratorConfig<DescriptorSchema, ExportMap, DependencyMap>,
): GeneratorConfig<DescriptorWithChildren & z.infer<DescriptorSchema>> {
  let dependencyMap: DependencyMap =
    config.dependencies || ({} as DependencyMap);

  return {
    parseDescriptor: (descriptor: DescriptorWithChildren, context) => {
      try {
        // TODO: Merge with base descriptor
        const mergedSchema = config.descriptorSchema?.and(baseDescriptorSchema);
        const validatedDescriptor = mergedSchema?.parse(
          descriptor,
        ) as DescriptorWithChildren & z.infer<DescriptorSchema>;
        const { id } = context;
        const childGeneratorConfigs =
          config.getDefaultChildGenerators?.(descriptor) || {};

        // make sure descriptor children match context
        const descriptorChildren = descriptor.children || {};
        const invalidChild = Object.keys(descriptorChildren)
          .filter((key) => !key.startsWith('$'))
          .find((key) => !childGeneratorConfigs[key]);
        if (invalidChild) {
          throw new Error(
            `Unknown child found in descriptor: ${invalidChild} (in ${id}). Prefix key with $ if custom child`,
          );
        }

        const mergeAndValidateDescriptor = (
          { defaultDescriptor, defaultToNullIfEmpty }: ChildGeneratorConfig,
          descriptorChild:
            | Partial<BaseGeneratorDescriptor>
            | string
            | undefined,
        ): BaseGeneratorDescriptor | string | null => {
          if (typeof descriptorChild === 'string') {
            // child references are not parsed currently
            // TODO: Figure out better solution?
            return descriptorChild;
          }

          // if neither default descriptor nor descriptor child is provided, assume null
          // if no descriptor child and we've been told to default to null, return null
          // if descriptor child is null, assume it's been explicitly removed
          if (
            (!defaultDescriptor && !descriptorChild) ||
            (!descriptorChild && defaultToNullIfEmpty) ||
            descriptorChild === null
          ) {
            return null;
          }

          const mergedDescriptor = R.mergeRight(
            defaultDescriptor || {},
            descriptorChild || {},
          );

          const validatedChildDescriptor = baseDescriptorSchema
            .passthrough()
            .parse(mergedDescriptor);

          // TODO: Need to implement provider

          return validatedChildDescriptor;
        };

        const children = R.mapObjIndexed((value, key) => {
          const { isMultiple } = value;

          if (isMultiple) {
            const childArray = descriptorChildren[key] || [];
            if (!Array.isArray(childArray)) {
              throw new Error(`${id} has invalid child ${key}. Must be array.`);
            }
            return childArray
              .map((childDescriptor) =>
                mergeAndValidateDescriptor(value, childDescriptor),
              )
              .filter(notEmpty);
          }
          const child = descriptorChildren[key];

          if (Array.isArray(child)) {
            throw new Error(`${id} has invalid child ${key}. Cannot be array.`);
          }
          return mergeAndValidateDescriptor(value, child);
        }, childGeneratorConfigs);

        const customChildren: Record<string, BaseGeneratorDescriptor | string> =
          R.pickBy((_, key) => key.startsWith('$'), descriptorChildren);

        if (config.populateDependencies && config.dependencies) {
          dependencyMap = config.populateDependencies(
            config.dependencies,
            validatedDescriptor,
          ) as DependencyMap;
        }

        return {
          children: R.mergeRight(children, customChildren),
          validatedDescriptor,
        };
      } catch (err) {
        context.logger.error(
          `Descriptor validation failed at ${context.id}: ${
            (err as Error).message
          }`,
        );
        throw err;
      }
    },
    createGenerator: (descriptor) => [
      {
        name: 'main',
        dependencies: dependencyMap,
        exports: config.exports,
        taskDependencies: [],
        run(dependencies) {
          return config.createGenerator(
            descriptor,
            dependencies as InferDependencyProviderMap<DependencyMap>,
          );
        },
      },
    ],
  };
}
