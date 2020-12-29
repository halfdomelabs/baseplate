/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { promises as fs } from 'fs';
import * as yup from 'yup';
import path from 'path';
import R from 'ramda';
import toposort from 'toposort';
import { baseDescriptorSchema, GeneratorDescriptor } from './descriptor';
import { GeneratorConfig, Generator, ChildGenerator } from './generator';
import { Action, ActionContext, PostActionCallback } from './action';
import { GeneratorBuildContext, GeneratorProviderContext } from './context';
import { FormatterProvider } from '../providers/formatter';
import { ProviderType } from './provider';

/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface GeneratorEntry {
  id: string;
  generatorConfig: GeneratorConfig<any>;
  descriptor: GeneratorDescriptor;
  childGenerators: GeneratorEntry[];
}

export interface ActionsWithContext {
  actions: Action[];
  generatorDirectory: string;
  formatter?: FormatterProvider | null;
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
    const projectPath = path.join(directory, 'baseplate/project.json');
    return this.loadProjectFile(projectPath);
  }

  /**
   * Loads the generator entry associated with a project file
   *
   * @param file Path to project file
   */
  private async loadProjectFile(file: string): Promise<GeneratorEntry> {
    const data = JSON.parse(
      await fs.readFile(file, 'utf8')
    ) as GeneratorDescriptor;
    if (!data) {
      throw new Error(`Descriptor in ${file} is invalid!`);
    }

    return this.buildGeneratorEntry(data, 'root');
  }

  /**
   * Validates and normalizees child generator descriptors into array
   *
   * @param config Child generator config
   * @param descriptor Descriptor for child generator(s)
   * @param childKey Key of child generator (for better error messages)
   * @param entryId ID of parent entry (for better error messages)
   */
  private validateChildGeneratorDescriptors(
    config: ChildGenerator,
    descriptor: GeneratorDescriptor | GeneratorDescriptor[],
    childKey: string,
    entryId: string
  ): GeneratorDescriptor[] {
    const { defaultDescriptor, multiple, provider } = config;

    const descriptors = (() => {
      if (!descriptor) {
        return [];
      }
      return Array.isArray(descriptor) ? descriptor : [descriptor];
    })();

    // create placeholder default descriptor if no descriptor exist
    if (!descriptors.length && defaultDescriptor) {
      descriptors.push(defaultDescriptor);
    }

    if (!multiple && descriptors.length > 1) {
      throw new Error(
        `${childKey} in ${entryId} can only contain one generator`
      );
    }

    // verify names are on all multiple entries
    if (multiple && descriptors.some((d) => !d.name)) {
      throw new Error(
        `Each child descriptor in ${childKey} for ${entryId} must have a name`
      );
    }

    // verify provides
    if (
      provider &&
      !descriptors.every((d) =>
        this.generators[d.generator].provides?.includes(provider)
      )
    ) {
      throw new Error(
        `Each child descriptor in ${childKey} for ${entryId} must implement ${provider}`
      );
    }

    return descriptors;
  }

  /**
   * Recursively builds the generator entry from its descriptor
   *
   * @param data Starting descriptor for the generator
   * @param id Generated ID of the generator entry
   * @param currentDirectory Relative current directory to build the generator entry in
   */
  private async buildGeneratorEntry(
    data: GeneratorDescriptor,
    id: string
  ): Promise<GeneratorEntry> {
    const generatorConfig = this.generators[data.generator];
    if (!generatorConfig) {
      throw new Error(
        `Descriptor at ${id} has an invalid generator "${data.generator}"!`
      );
    }

    // validate descriptor
    const validatedDescriptor = await yup
      .object<GeneratorDescriptor>({
        ...baseDescriptorSchema,
        ...generatorConfig.descriptorSchema,
      })
      .validate(data);

    const childGeneratorDescriptors = validatedDescriptor.children || {};
    const childGeneratorConfigs = generatorConfig.childGenerators || {};

    const childGeneratorConfigKeys = Object.keys(childGeneratorConfigs);

    // check descriptor doesn't have extra children generators that aren't defined in the generator config
    const extraChildGeneratorDescriptors = Object.keys(
      childGeneratorDescriptors
    ).filter((d) => !childGeneratorConfigKeys.includes(d));
    if (extraChildGeneratorDescriptors.length) {
      throw new Error(
        `Extra child generator descriptor not in config found in ${id}: ${extraChildGeneratorDescriptors}`
      );
    }

    const childEntryPromises = childGeneratorConfigKeys.map((key) => {
      const childGeneratorConfig = childGeneratorConfigs[key];
      const childDescriptorRaw = childGeneratorDescriptors[key];

      const childDescriptors = this.validateChildGeneratorDescriptors(
        childGeneratorConfig,
        childDescriptorRaw,
        key,
        id
      );

      return childDescriptors.map((descriptor) => {
        if (childGeneratorConfig.multiple) {
          return this.buildGeneratorEntry(
            descriptor,
            `${id}/${key}/${descriptor.name}`
          );
        }
        // sanity check
        if (childDescriptors.length > 1) {
          throw new Error('Invalid State: This should not happen');
        }
        return this.buildGeneratorEntry(descriptor, `${id}/${key}`);
      });
    });

    const childGenerators = await Promise.all(R.flatten(childEntryPromises));

    return {
      id,
      generatorConfig,
      descriptor: validatedDescriptor,
      childGenerators,
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
    parentProviders: Record<string, string>
  ): Record<string, Record<string, string>> {
    // build entry dependency map from parent providers
    const requiredProviders = entry.generatorConfig.requires || [];

    const entryDependencyMap = R.zipObj(
      requiredProviders,
      requiredProviders.map((provider) => {
        if (!parentProviders[provider]) {
          throw new Error(`Could not find provider ${provider} at ${entry.id}`);
        }
        return parentProviders[provider];
      })
    );

    // force formatter to be optionally added since it's used by most actions
    const { formatter } = parentProviders;
    if (formatter && !entry.generatorConfig.provides?.includes('formatter')) {
      entryDependencyMap.formatter = formatter;
    }

    // get all the peer providers from the children and self provider
    const childProviders = entry.childGenerators
      .filter((g) => g.descriptor.peerProvider)
      .map((g) =>
        (g.generatorConfig.provides || []).map((name) => ({
          [name]: g.id,
        }))
      );

    const selfProviders = R.mergeAll(
      (entry.generatorConfig.provides || []).map((name) => ({
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
      entry.childGenerators.map((e) =>
        this.buildEntriesDependencyMap(e, providerMap)
      )
    );

    return {
      ...childDependencyMaps,
      [entry.id]: entryDependencyMap,
    };
  }

  async build(rootEntry: GeneratorEntry): Promise<ActionsWithContext[]> {
    function flattenEntries(entry: GeneratorEntry): GeneratorEntry[] {
      const childGenerators = entry.childGenerators.map(flattenEntries);
      return R.flatten([entry, ...childGenerators]);
    }

    // resolve dependencies
    const dependencyMaps = this.buildEntriesDependencyMap(rootEntry, {});

    // figure out dependency tree
    const entries = flattenEntries(rootEntry);
    const entriesById = R.indexBy(R.prop('id'), entries);

    const dependencyGraph = R.unnest(
      entries.map((entry) =>
        Object.values(dependencyMaps[entry.id]).map((dependentId): [
          string,
          string
        ] => [dependentId, entry.id])
      )
    );

    const sortedEntryIds = toposort.array(
      entries.map(R.prop('id')),
      dependencyGraph
    );

    const generatorsById: Record<string, Generator<any>> = {};
    const providerMap: Record<string, Record<string, any>> = {};

    // initialize generators
    for (const entryId of sortedEntryIds) {
      const entry = entriesById[entryId];
      generatorsById[entryId] = entry.generatorConfig.createGenerator(
        entry.descriptor
      );
    }

    const getProviderByEntryIdAndName = (
      entryId: string,
      provider: string | ProviderType
    ): any => {
      const name = typeof provider === 'string' ? provider : provider.name;
      const providerId = dependencyMaps[entryId][name];
      if (!providerId) {
        throw new Error(
          `Provider ${name} must be required before requested in entry ${entryId}`
        );
      }
      return providerMap[providerId][name];
    };

    const getOptionalProviderByEntryIdAndName = (
      entryId: string,
      provider: string | ProviderType
    ): any => {
      const name = typeof provider === 'string' ? provider : provider.name;
      const providerId = dependencyMaps[entryId][name];
      if (!providerId) {
        return null;
      }
      return providerMap[providerId][name] || null;
    };

    // initialize providers (beginning at the bottom of dependency tree)
    for (const entryId of sortedEntryIds) {
      const entry = entriesById[entryId];
      const generator = generatorsById[entryId];
      if (generator.getProviders) {
        const context: GeneratorProviderContext = {
          getProvider: (name) => getProviderByEntryIdAndName(entryId, name),
        };
        const publishedProviders = generator.getProviders(context);
        providerMap[entryId] = publishedProviders;

        // make sure providers match config
        const configProviders = entry.generatorConfig.provides || [];
        const publishedNames = Object.keys(publishedProviders);
        const missingProviders = R.difference(configProviders, publishedNames);
        if (missingProviders.length) {
          throw new Error(
            `${entry.id} (${entry.descriptor.generator}) must provide additional providers: ${missingProviders}`
          );
        }
        const additionalProviders = R.difference(
          publishedNames,
          configProviders
        );
        if (additionalProviders.length) {
          throw new Error(
            `${entry.id} must specify additional providers in config: ${additionalProviders}`
          );
        }
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
        getProvider: (name) => getProviderByEntryIdAndName(entryId, name),
        getOptionalProvider: (name) =>
          getOptionalProviderByEntryIdAndName(entryId, name),
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
      buildActions.push({
        actions,
        generatorDirectory: entry.generatorConfig.baseDirectory,
        formatter: context.getOptionalProvider('formatter'),
      });
    }
    return buildActions;
  }

  async executeActions(
    contextualizedActions: ActionsWithContext[],
    directory: string
  ): Promise<void> {
    const postActionCallbacks: PostActionCallback[] = [];
    for (const contexutalizedAction of contextualizedActions) {
      const { actions, generatorDirectory, formatter } = contexutalizedAction;
      const context: ActionContext = {
        currentDirectory: directory,
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
