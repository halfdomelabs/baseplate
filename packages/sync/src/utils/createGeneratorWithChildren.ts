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
  isMultiple?: true;
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

      function mergeAndValidateDescriptor(
        defaultDescriptor: Partial<BaseGeneratorDescriptor> | undefined,
        descriptorChild: Partial<BaseGeneratorDescriptor> | string | undefined,
        provider?: string
      ): BaseGeneratorDescriptor | string | null {
        if (typeof descriptorChild === 'string') {
          // child references are not parsed currently
          // TODO: Figure out better solution?
          return descriptorChild;
        }

        // if neither default descriptor nor descriptor child is provided, assume null
        // if descriptor child is null, assume it's been explicitly removed
        if (
          (!defaultDescriptor && !descriptorChild) ||
          descriptorChild === null
        ) {
          return null;
        }

        const mergedDescriptor = R.mergeRight(
          defaultDescriptor || {},
          descriptorChild || {}
        );

        const validatedDescriptor = yup
          .object(baseDescriptorSchema)
          .validateSync(mergedDescriptor);

        if (provider) {
          const childGeneratorConfig =
            generatorMap[validatedDescriptor.generator];
          if (!childGeneratorConfig) {
            throw new Error(
              `Child generator in ${id} has invalid generator ${validatedDescriptor.generator}`
            );
          }
          const exportKeys = Object.keys(childGeneratorConfig.exports || {});
          if (
            !exportKeys.some(
              (key) => childGeneratorConfig.exports?.[key].name === provider
            )
          ) {
            throw new Error(
              `Child generator ${validatedDescriptor.generator} in ${id} does not provide ${provider}`
            );
          }
        }
        return validatedDescriptor;
      }

      const children = R.mapObjIndexed((value, key) => {
        const { isMultiple, provider, defaultDescriptor } = value;

        if (isMultiple) {
          const childArray = descriptorChildren[key] || [];
          if (!Array.isArray(childArray)) {
            throw new Error(`${id} has invalid child ${key}. Must be array.`);
          }
          return childArray
            .map((childDescriptor) =>
              mergeAndValidateDescriptor(
                defaultDescriptor,
                childDescriptor,
                provider
              )
            )
            .filter(notEmpty);
        }
        const child = descriptorChildren[key] || {};

        if (Array.isArray(child)) {
          throw new Error(`${id} has invalid child ${key}. Cannot be array.`);
        }
        return mergeAndValidateDescriptor(defaultDescriptor, child, provider);
      }, childGeneratorConfigs);

      const customChildren: Record<string, BaseGeneratorDescriptor | string> =
        R.pickBy((_, key) => key.startsWith('$'), descriptorChildren);

      return {
        children: R.mergeRight(children, customChildren),
        dependencies: config.dependencies,
        validatedDescriptor: config.descriptorSchema?.validateSync(descriptor),
      };
    },
    exports: config.exports,
    createGenerator: config.createGenerator,
  };
}
