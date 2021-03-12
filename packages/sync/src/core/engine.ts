/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { promises as fs } from 'fs';
import * as yup from 'yup';
import path from 'path';
import R from 'ramda';
import toposort from 'toposort';
import {
  baseDescriptorSchema,
  ChildDescriptorsOrReferences,
  GeneratorDescriptor,
} from './descriptor';
import { GeneratorConfig, Generator, ChildGenerator } from './generator';
import { Action, ActionContext, PostActionCallback } from './action';
import { GeneratorBuildContext } from './context';
import { FormatterProvider } from '../providers/formatter';
import { ProviderDependency, ProviderType } from './provider';
import { notEmpty } from '../utils/arrays';

/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface GeneratorEntry {
  id: string;
  generatorConfig: GeneratorConfig<any>;
  descriptor: GeneratorDescriptor;
  children: GeneratorEntry[];
  peerProvider: boolean;
}

export interface ActionsWithContext {
  actions: Action[];
  generatorDirectory: string;
  formatter?: FormatterProvider | null;
}

function providerMapToNames(map?: {
  [key: string]: ProviderType | ProviderDependency;
}): string[] {
  if (!map) {
    return [];
  }
  return Object.values(map).map((d) => d.name);
}

function normalizeToArray<T>(objOrArr?: T | T[]): T[] {
  if (!objOrArr) {
    return [];
  }
  return Array.isArray(objOrArr) ? objOrArr : [objOrArr];
}

async function validateDescriptor(
  descriptor: GeneratorDescriptor,
  generatorConfig: GeneratorConfig<any>,
  id: string
): Promise<GeneratorDescriptor> {
  const cleanedDescriptor = R.pickBy(
    (value, key) => !key.startsWith('$'),
    descriptor
  );
  const validatedDescriptor = await yup
    .object<GeneratorDescriptor>({
      ...baseDescriptorSchema,
      ...generatorConfig.descriptorSchema,
    })
    .noUnknown(true)
    .required()
    .strict(true)
    .validate(cleanedDescriptor);

  // validate children
  const childConfigs = generatorConfig.childGenerators || {};
  const childConfigKeys = Object.keys(childConfigs);

  const primaryChildrenKeys = Object.keys(
    validatedDescriptor.children || {}
  ).filter((key) => !key.startsWith('$'));

  // ensure all primary children are keyed in generator config
  const extraChildrenKeys = R.difference(primaryChildrenKeys, childConfigKeys);
  if (extraChildrenKeys.length) {
    throw new Error(
      `Extra primary child generator descriptor not in config found in ${id}: ${extraChildrenKeys.join(
        ', '
      )}`
    );
  }

  // validate child configs match
  Object.entries(childConfigs).forEach(([key, childConfig]) => {
    const descriptorChildOrChildren =
      descriptor.children && descriptor.children[key];

    if (
      descriptorChildOrChildren &&
      Array.isArray(descriptorChildOrChildren) &&
      !childConfig.multiple
    ) {
      throw new Error(
        `${id} must have a single (non-array) child with the key ${key}`
      );
    }

    if (
      descriptorChildOrChildren &&
      !Array.isArray(descriptorChildOrChildren) &&
      childConfig.multiple
    ) {
      throw new Error(`${id} must have an array child with the key ${key}`);
    }

    const descriptorChildren = normalizeToArray(descriptorChildOrChildren);
    if (
      !descriptorChildren.length &&
      childConfig.required &&
      !childConfig.defaultDescriptor
    ) {
      throw new Error(`${id} must have a child with the key ${key}`);
    }
  });

  return validatedDescriptor;
}

async function loadGeneratorFromFile(
  filePath: string
): Promise<GeneratorDescriptor> {
  const data = JSON.parse(
    await fs.readFile(`${filePath}.json`, 'utf8')
  ) as GeneratorDescriptor;
  if (!data) {
    throw new Error(`Descriptor in ${filePath} is invalid!`);
  }

  return data;
}

function appendToId(baseId: string, suffix: string): string {
  return baseId.includes(':') ? `${baseId}.${suffix}` : `${baseId}:${suffix}`;
}

async function resolveDescriptorOrRef(
  descriptorOrRef: GeneratorDescriptor | string,
  baseId: string,
  isMultiple: boolean,
  baseDirectory: string
): Promise<{ id: string; descriptor: GeneratorDescriptor }> {
  if (typeof descriptorOrRef === 'string') {
    const filePath = path.join(baseDirectory, descriptorOrRef);
    const descriptor = await loadGeneratorFromFile(filePath);
    return {
      id: descriptorOrRef,
      descriptor,
    };
  }

  if (isMultiple) {
    if (!descriptorOrRef.name) {
      throw new Error(`Name is required for all children of ${baseId}`);
    }
    return {
      id: appendToId(baseId, descriptorOrRef.name),
      descriptor: descriptorOrRef,
    };
  }
  return { id: baseId, descriptor: descriptorOrRef };
}

/**
 * Checks for duplicate IDs in generator entry and descendants
 *
 * @param rootEntry Root generator entry
 */
function checkDuplicateIds(rootEntry: GeneratorEntry): void {
  function extractIds(entry: GeneratorEntry): string[] {
    return [
      entry.id,
      ...R.flatten(entry.children.map((child) => extractIds(child))),
    ];
  }

  const ids = extractIds(rootEntry);
  const idCounts = R.countBy(R.identity, ids);
  const duplicatedIds = Object.entries(idCounts)
    .filter(([, count]) => count > 1)
    .map(([key]) => key);
  if (duplicatedIds.length) {
    throw new Error(
      `Duplicate IDs found in generator: ${duplicatedIds.join(', ')}`
    );
  }
}

export class GeneratorEngine {
  generators: Record<string, GeneratorConfig<any>>;

  constructor(generators: Record<string, GeneratorConfig<any>>) {
    this.generators = generators;
  }

  /**
   * Loads the root generator entry of a project
   *
   * @param directory Directory of project to load
   */
  async loadProject(directory: string): Promise<GeneratorEntry> {
    const projectPath = path.join(directory, 'baseplate');
    const rootEntry = await this.loadProjectFile(projectPath, 'project');
    checkDuplicateIds(rootEntry);
    return rootEntry;
  }

  /**
   * Loads the generator entry associated with a project file
   *
   * @param file Path to project file
   */
  private async loadProjectFile(
    baseDirectory: string,
    file: string
  ): Promise<GeneratorEntry> {
    const data = await loadGeneratorFromFile(path.join(baseDirectory, file));

    const entry = this.buildGeneratorEntry(data, file, baseDirectory, true);
    return entry;
  }

  private async resolveChildGenerators(
    childDescriptorsOrRefs: ChildDescriptorsOrReferences,
    baseId: string,
    baseDirectory: string,
    childConfig?: ChildGenerator
  ): Promise<GeneratorEntry[]> {
    const normalizedDescriptorsOrRefs = normalizeToArray(
      childDescriptorsOrRefs
    );

    if (
      normalizedDescriptorsOrRefs.length === 0 &&
      childConfig?.defaultDescriptor
    ) {
      normalizedDescriptorsOrRefs.push(childConfig?.defaultDescriptor);
    }

    const isMultiple = Array.isArray(childDescriptorsOrRefs);
    const requiredProvider = childConfig?.provider;
    const requiredProviderName =
      typeof requiredProvider === 'string'
        ? requiredProvider
        : requiredProvider?.name;

    const buildChildGeneratorEntry = async (
      descriptorOrRef: GeneratorDescriptor | string
    ): Promise<GeneratorEntry> => {
      const { id, descriptor } = await resolveDescriptorOrRef(
        descriptorOrRef,
        baseId,
        isMultiple,
        baseDirectory
      );

      // built child
      const builtChild = await this.buildGeneratorEntry(
        descriptor,
        id,
        baseDirectory,
        !isMultiple
      );

      // check generator implements necessary provider
      const childExports = Object.values(
        builtChild.generatorConfig.exports || {}
      ).map((e) => e.name);
      if (
        requiredProviderName &&
        !childExports.includes(requiredProviderName)
      ) {
        throw new Error(
          `Each child descriptor for ${baseId} must implement ${requiredProviderName}: ${id} does not`
        );
      }
      return builtChild;
    };

    return Promise.all(
      normalizedDescriptorsOrRefs.map(buildChildGeneratorEntry)
    );
  }

  /**
   * Recursively builds the generator entry from its descriptor
   *
   * @param data Starting descriptor for the generator
   * @param id Generated ID of the generator entry
   * @param currentDirectory Relative current directory to build the generator entry in
   */
  private async buildGeneratorEntry(
    descriptor: GeneratorDescriptor,
    id: string,
    baseDirectory: string,
    peerProvider: boolean
  ): Promise<GeneratorEntry> {
    const generatorConfig = this.generators[descriptor.generator];
    if (!generatorConfig) {
      throw new Error(
        `Descriptor at ${id} has an unknown generator "${descriptor.generator}"!`
      );
    }

    // validate descriptor and strip out any $ metadata
    const validatedDescriptor = await validateDescriptor(
      descriptor,
      generatorConfig,
      id
    );

    // generate children
    const children = { ...descriptor.children };

    Object.entries(generatorConfig.childGenerators || {}).forEach(
      ([key, config]) => {
        if (children[key] === undefined && config.defaultDescriptor) {
          children[key] = config.defaultDescriptor;
        }
      }
    );

    const childrenEntries = Object.entries(children || {});

    const childGenerators = await Promise.all(
      childrenEntries.map(async ([key, childDescriptorOrRef]) =>
        this.resolveChildGenerators(
          childDescriptorOrRef,
          appendToId(id, key),
          baseDirectory,
          generatorConfig.childGenerators &&
            generatorConfig.childGenerators[key]
        )
      )
    );

    return {
      id,
      generatorConfig,
      descriptor: validatedDescriptor,
      children: R.flatten(childGenerators),
      peerProvider,
    };
  }

  /**
   * Builds a map of an entry's required providers to the entry IDs of resolved providers
   *
   * @param entry
   * @param parentProviders
   */
  private buildEntriesDependencyMap(
    entry: GeneratorEntry,
    parentProviders: Record<string, string>,
    globalGeneratorMap: Record<string, GeneratorEntry>
  ): Record<string, Record<string, string | null>> {
    // build entry dependency map from parent providers
    const dependencies = Object.entries(entry.generatorConfig.dependsOn || {});
    const references = entry.descriptor.references || {};

    const entryDependencyMap = R.zipObj(
      dependencies.map(([key]) => key),
      dependencies.map(([key, dep]) => {
        const provider = dep.name;
        const isOptional = dep.type === 'dependency' && dep.options.optional;
        const isReference = dep.type === 'dependency' && dep.options.reference;
        if (isReference) {
          const reference = references[key];
          if (!reference) {
            if (!isOptional) {
              throw new Error(
                `Must provide dependency reference for ${key} at ${entry.id}`
              );
            }
            return null;
          }
          const referencedGenerator = globalGeneratorMap[reference];
          if (!referencedGenerator) {
            throw new Error(
              `Could not find referenced generator ${reference} in ${entry.id}`
            );
          }
          // check provider matches type
          const generatorProviders = providerMapToNames(
            referencedGenerator.generatorConfig.exports
          );
          if (!generatorProviders.includes(provider)) {
            throw new Error(
              `Referenced generator ${reference} does not implement ${provider} in ${entry.id}`
            );
          }
          return referencedGenerator.id;
        }

        if (!parentProviders[provider]) {
          if (!isOptional) {
            throw new Error(
              `Could not find required provider ${provider} at ${entry.id}`
            );
          }
          return null;
        }
        return parentProviders[provider];
      })
    );

    // force formatter to be optionally added since it's used by most actions
    const { formatter } = parentProviders;
    if (
      formatter &&
      !providerMapToNames(entry.generatorConfig.exports).includes('formatter')
    ) {
      entryDependencyMap.formatter = formatter;
    }

    // get all the peer providers from the children and self provider
    const childProviders = entry.children
      .filter((g) => g.peerProvider)
      .map((g) =>
        providerMapToNames(g.generatorConfig.exports).map((name) => ({
          [name]: g.id,
        }))
      );

    const selfProviders = R.mergeAll(
      providerMapToNames(entry.generatorConfig.exports).map((name) => ({
        [name]: entry.id,
      }))
    );

    const safeMerge = R.mergeWithKey((key) => {
      throw new Error(`Duplicate ${key} provider detected at ${entry.id}`);
    });
    const mergedProviders: Record<string, string> = R.reduce(
      safeMerge,
      {},
      R.flatten(childProviders)
    );

    const providerMap = {
      ...parentProviders,
      ...selfProviders,
      ...mergedProviders,
    };

    const childDependencyMaps = R.mergeAll(
      entry.children.map((e) =>
        this.buildEntriesDependencyMap(e, providerMap, globalGeneratorMap)
      )
    );

    return {
      ...childDependencyMaps,
      [entry.id]: entryDependencyMap,
    };
  }

  async build(rootEntry: GeneratorEntry): Promise<ActionsWithContext[]> {
    function flattenEntries(entry: GeneratorEntry): GeneratorEntry[] {
      const childGenerators = entry.children.map(flattenEntries);
      return R.flatten([entry, ...childGenerators]);
    }
    const entries = flattenEntries(rootEntry);
    const entriesById = R.indexBy(R.prop('id'), entries);
    console.log(entries.map((e) => e.id));

    // resolve dependencies
    const dependencyMaps = this.buildEntriesDependencyMap(
      rootEntry,
      {},
      entriesById
    );

    // figure out dependency tree
    const dependencyGraph = R.unnest(
      entries.map((entry) =>
        Object.values(dependencyMaps[entry.id])
          .filter(notEmpty)
          .map((dependentId): [string, string] => [dependentId, entry.id])
      )
    );

    const sortedEntryIds = toposort.array(
      entries.map(R.prop('id')),
      dependencyGraph
    );

    const generatorsById: Record<string, Generator<any>> = {};
    const providerMap: Record<string, Record<string, any>> = {};

    // initialize providers (beginning at the bottom of dependency tree)
    for (const entryId of sortedEntryIds) {
      const entry = entriesById[entryId];
      // resolve dependencies and format into entry
      const resolveDependency = (
        providerDependency: ProviderType<any> | ProviderDependency<any>,
        key: string
      ): any => {
        const dependency: ProviderDependency<any> =
          // eslint-disable-next-line no-underscore-dangle
          providerDependency.type === 'type'
            ? providerDependency.dependency()
            : providerDependency;
        const {
          name,
          options: { optional },
        } = dependency;
        const providerId = dependencyMaps[entryId][key];
        if (!providerId) {
          if (optional) {
            return undefined;
          }
          // shouldn't happen if we do checks correctly
          throw new Error(
            `Required provider ${name} not present for entry ${entryId}`
          );
        }
        return providerMap[providerId][name];
      };
      const dependencies = R.mapObjIndexed(
        resolveDependency,
        entry.generatorConfig.dependsOn || {}
      );

      const generator = entry.generatorConfig.createGenerator(
        entry.descriptor,
        dependencies
      );
      generatorsById[entryId] = generator;

      if (generator.getProviders) {
        const exportedProviders = generator.getProviders({});

        // map exported providers to their provider name
        const configExports = entry.generatorConfig.exports || {};
        const configExportKeys = Object.keys(configExports);
        providerMap[entryId] = R.fromPairs(
          configExportKeys.map((key) => {
            const { name } = configExports[key];
            const provider = exportedProviders[key];
            if (!provider) {
              throw new Error(
                `${entry.descriptor.generator} must provide the ${name} provider`
              );
            }
            return [name, provider];
          })
        );
      }
    }

    const buildActions: ActionsWithContext[] = [];

    // get all the actions
    for (const entryId of R.reverse(sortedEntryIds)) {
      const entry = entriesById[entryId];
      const generator = generatorsById[entryId];
      const actions: Action[] = [];
      const context: GeneratorBuildContext = {
        actions,
        addAction(action) {
          actions.push(action);
        },
      };
      if (!entry.generatorConfig.baseDirectory) {
        throw new Error(
          `Generator ${entry.descriptor.generator} must have base directory (defined either in generator config or loader)`
        );
      }

      await Promise.resolve(generator.build(context));
      const formatterId = dependencyMaps[entryId].formatter;
      const formatter = formatterId && providerMap[formatterId].formatter;

      buildActions.push({
        actions,
        generatorDirectory: entry.generatorConfig.baseDirectory,
        formatter,
      });
    }
    return buildActions;
  }

  async executeActions(
    contextualizedActions: ActionsWithContext[],
    directory: string
  ): Promise<void> {
    const postActionCallbacks: PostActionCallback[] = [];
    const resolvedDirectory = path.resolve(directory);
    for (const contexutalizedAction of contextualizedActions) {
      const { actions, generatorDirectory, formatter } = contexutalizedAction;
      const context: ActionContext = {
        currentDirectory: resolvedDirectory,
        generatorDirectory,
        formatter,
        addPostActionCallback: (callback) => {
          postActionCallbacks.push(callback);
        },
      };
      for (const action of actions) {
        await action.execute(context);
      }
      for (const callback of postActionCallbacks) {
        await callback();
      }
    }
  }
}
