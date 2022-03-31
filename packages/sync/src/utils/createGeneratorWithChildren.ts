import R from 'ramda';
import * as yup from 'yup';
import {
  BaseGeneratorDescriptor,
  ProviderDependencyMap,
  ProviderExportMap,
  GeneratorConfig,
  baseDescriptorSchema,
} from '../core';
import { notEmpty } from './arrays';

export interface DescriptorWithChildren extends BaseGeneratorDescriptor {
  children?: Record<
    string,
    | Partial<BaseGeneratorDescriptor>
    | string
    | Partial<BaseGeneratorDescriptor>[]
    | string[]
  >;
}

export interface ChildGeneratorConfig {
  provider?: string;
  isMultiple?: boolean;
  /**
   * Whether to default to null if no config is provided.
   */
  defaultToNullIfEmpty?: boolean;
  defaultDescriptor?: BaseGeneratorDescriptor & {
    [key: string]: unknown;
  };
}

export interface SimpleGeneratorConfig<
  DescriptorSchema extends yup.BaseSchema,
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap
> {
  descriptorSchema?: DescriptorSchema;
  getDefaultChildGenerators?(
    descriptor: yup.InferType<DescriptorSchema>
  ): Record<string, ChildGeneratorConfig>;
  exports?: ExportMap;
  dependencies?: DependencyMap;
  // we need a separate function because we can't infer the type of the
  // dependency map from a generator function that takes in a generic descriptor
  populateDependencies?: (
    dependencyMap: DependencyMap,
    descriptor: yup.InferType<DescriptorSchema>
  ) => ProviderDependencyMap;
  createGenerator: GeneratorConfig<
    DescriptorWithChildren & yup.InferType<DescriptorSchema>,
    ExportMap,
    DependencyMap
  >['createGenerator'];
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
  DescriptorSchema extends yup.BaseSchema,
  ExportMap extends ProviderExportMap,
  DependencyMap extends ProviderDependencyMap
>(
  config: SimpleGeneratorConfig<DescriptorSchema, ExportMap, DependencyMap>
): GeneratorConfig<
  DescriptorWithChildren & yup.InferType<DescriptorSchema>,
  ExportMap,
  DependencyMap
> {
  return {
    parseDescriptor: (descriptor: DescriptorWithChildren, context) => {
      try {
        const validatedDescriptor =
          config.descriptorSchema?.validateSync(descriptor);
        const { id, generatorMap } = context;
        const childGeneratorConfigs =
          config.getDefaultChildGenerators?.(descriptor) || {};

        // make sure descriptor children match context
        const descriptorChildren = descriptor.children || {};
        const invalidChild = Object.keys(descriptorChildren)
          .filter((key) => !key.startsWith('$'))
          .find((key) => !childGeneratorConfigs[key]);
        if (invalidChild) {
          throw new Error(
            `Unknown child found in descriptor: ${invalidChild} (in ${id}). Prefix key with $ if custom child`
          );
        }

        const mergeAndValidateDescriptor = (
          {
            defaultDescriptor,
            provider,
            defaultToNullIfEmpty,
          }: ChildGeneratorConfig,
          descriptorChild: Partial<BaseGeneratorDescriptor> | string | undefined
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
            descriptorChild || {}
          );

          const validatedChildDescriptor = yup
            .object(baseDescriptorSchema)
            .validateSync(mergedDescriptor);

          if (provider) {
            const childGeneratorConfig =
              generatorMap[validatedChildDescriptor.generator];
            if (!childGeneratorConfig) {
              throw new Error(
                `Child generator in ${id} has invalid generator ${validatedChildDescriptor.generator}`
              );
            }
            const exportKeys = Object.keys(childGeneratorConfig.exports || {});
            if (
              !exportKeys.some(
                (key) => childGeneratorConfig.exports?.[key].name === provider
              )
            ) {
              throw new Error(
                `Child generator ${validatedChildDescriptor.generator} in ${id} does not provide ${provider}`
              );
            }
          }
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
                mergeAndValidateDescriptor(value, childDescriptor)
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

        const dependencies =
          config.populateDependencies && config.dependencies
            ? (config.populateDependencies(
                config.dependencies,
                validatedDescriptor
              ) as DependencyMap)
            : config.dependencies;

        return {
          children: R.mergeRight(children, customChildren),
          dependencies,
          validatedDescriptor,
        };
      } catch (err) {
        console.error(`Descriptor validation failed at ${context.id}`);
        throw err;
      }
    },
    exports: config.exports,
    createGenerator: config.createGenerator,
  };
}
