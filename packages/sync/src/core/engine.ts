/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { promises as fs } from 'fs';
import * as yup from 'yup';
import path from 'path';
import R from 'ramda';
import toposort from 'toposort';
import { baseDescriptorSchema, GeneratorDescriptor } from './descriptor';
import { Generator } from './generator';
import { Action, ActionContext } from './action';
import { GeneratorContext } from './context';

/* eslint-disable class-methods-use-this */
/* eslint-disable @typescript-eslint/no-explicit-any */

interface GeneratorEntry {
  id: string;
  generator: Generator<any>;
  descriptor: GeneratorDescriptor;
  childGenerators: GeneratorEntry[];
  currentDirectory: string;
}

export interface ActionsWithContext {
  actions: Action[];
  currentDirectory: string;
  generatorDirectory: string;
}

export class GeneratorEngine {
  generators: Record<string, Generator<any>>;

  constructor(generators: Record<string, Generator<any>>) {
    this.generators = generators;
  }

  async loadProject(directory: string): Promise<GeneratorEntry> {
    const projectPath = path.join(directory, 'baseplate/project.json');
    return this.loadProjectFile(projectPath);
  }

  private async getGeneratorEntry(
    data: GeneratorDescriptor,
    id: string,
    currentDirectory: string
  ): Promise<GeneratorEntry> {
    const generator = this.generators[data.generator];
    if (!generator) {
      throw new Error(
        `Descriptor at ${id} has an invalid generator "${data.generator}"!`
      );
    }

    // validate descriptor
    const validatedDescriptor = await yup
      .object<GeneratorDescriptor>({
        ...baseDescriptorSchema,
        ...generator.descriptorSchema,
      })
      .validate(data);

    const childGeneratorDescriptors = validatedDescriptor.children || {};
    const childGeneratorConfigs = generator.childGenerators || {};

    const childGeneratorConfigKeys = Object.keys(childGeneratorConfigs);

    const extraChildGeneratorDescriptor = Object.keys(
      childGeneratorDescriptors
    ).find((d) => !childGeneratorConfigKeys.includes(d));
    if (extraChildGeneratorDescriptor) {
      throw new Error(
        `Child generator without appropriate descriptor config found in ${id}: ${extraChildGeneratorDescriptor}`
      );
    }

    const childEntryPromises = childGeneratorConfigKeys.map((key) => {
      const childGeneratorConfig = childGeneratorConfigs[key];
      const childDescriptorRaw = childGeneratorDescriptors[key];
      let childDescriptors = Array.isArray(childDescriptorRaw)
        ? childDescriptorRaw || []
        : [childDescriptorRaw];

      // handle single default generator
      const defaults = {
        generator: childGeneratorConfig.defaultGenerator || '',
      };
      if (
        childDescriptors.length === 0 &&
        childGeneratorConfig.defaultGenerator
      ) {
        childDescriptors.push({
          ...defaults,
        });
      }

      // handle missing generators
      childDescriptors = childDescriptors.map((d) => R.mergeRight(defaults, d));

      if (!childGeneratorConfig.multiple) {
        if (childDescriptors.length === 0) {
          throw new Error(`Child descriptor for ${key} is required in ${id}`);
        }

        if (childDescriptors.length > 1) {
          throw new Error(
            `Only one child descriptor allowed for ${key} in ${id}`
          );
        }
      }

      // verify provides
      const { provider } = childGeneratorConfig;
      if (
        provider &&
        childDescriptors.every((d) =>
          this.generators[d.generator].provides?.includes(provider)
        )
      ) {
        throw new Error(
          `Child descriptor for ${key} must implement ${provider}`
        );
      }

      return childDescriptors.map((descriptor, i) =>
        this.getGeneratorEntry(
          descriptor,
          `${id}/${key}-${i}`,
          childGeneratorConfig.subdirectory
            ? path.join(currentDirectory, childGeneratorConfig.subdirectory)
            : currentDirectory
        )
      );
    });

    const childGenerators = await Promise.all(R.flatten(childEntryPromises));

    return {
      id,
      generator,
      descriptor: validatedDescriptor,
      childGenerators,
      currentDirectory,
    };
  }

  private async loadProjectFile(file: string): Promise<GeneratorEntry> {
    const data = JSON.parse(
      await fs.readFile(file, 'utf8')
    ) as GeneratorDescriptor;
    if (!data) {
      throw new Error(`Descriptor in ${file} is invalid!`);
    }

    return this.getGeneratorEntry(data, 'root', '');
  }

  private buildEntriesDependencyMap(
    entry: GeneratorEntry,
    parentProviders: Record<string, string>
  ): Record<string, Record<string, string>> {
    // get all the potential providers from the children
    const childProviders = entry.childGenerators.map((g) =>
      (g.generator.provides || []).map((name) => ({
        [name]: g.id,
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
      ...mergedProviders,
    };

    const requiredProviders = entry.generator.requires || [];

    // eslint-disable-next-line no-param-reassign
    const entryDependencyMap = R.zipObj(
      requiredProviders,
      requiredProviders.map((provider) => {
        if (!providerMap[provider]) {
          throw new Error(`Could not find provider ${provider} at ${entry.id}`);
        }
        return providerMap[provider];
      })
    );
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
        ] => [entry.id, dependentId])
      )
    );

    const sortedEntryIds = toposort.array(
      entries.map(R.prop('id')),
      dependencyGraph
    );

    const contextMap: Record<string, GeneratorContext> = {};
    const providerMap: Record<string, any> = {};

    // initialize contexts
    for (const entryId of sortedEntryIds) {
      const entry = entriesById[entryId];
      const actions: Action[] = [];
      contextMap[entryId] = {
        actions,
        directory: entry.currentDirectory,
        getProvider: (name) => {
          const provider = providerMap[entryId][name];
          if (!provider) {
            throw new Error(
              `Provider ${name} must be required before requested in entry ${entry.id}`
            );
          }
          return providerMap[entryId][provider];
        },
        addAction(action) {
          actions.push(action);
        },
      };
    }

    // get providers in order
    for (const entryId of sortedEntryIds) {
      const entry = entriesById[entryId];
      if (entry.generator.getProvider) {
        providerMap[entryId] = entry.generator.getProvider(
          entry.descriptor,
          contextMap[entryId]
        );
      }
    }

    const buildActions: ActionsWithContext[] = [];

    // get all the actions
    for (const entryId of R.reverse(sortedEntryIds)) {
      const entry = entriesById[entryId];
      await Promise.resolve(
        entry.generator.build(entry.descriptor, contextMap[entryId])
      );
      const { actions } = contextMap[entryId];
      if (!entry.generator.baseDirectory) {
        throw new Error(
          `Generator ${entry.descriptor.generator} must have base directory (defined either in generator config or loader)`
        );
      }
      buildActions.push({
        actions,
        currentDirectory: entry.currentDirectory,
        generatorDirectory: entry.generator.baseDirectory,
      });
    }
    return buildActions;
  }

  async executeActions(
    contextualizedActions: ActionsWithContext[],
    directory: string
  ): Promise<void> {
    for (const contexutalizedAction of contextualizedActions) {
      const {
        actions,
        currentDirectory,
        generatorDirectory,
      } = contexutalizedAction;
      const context: ActionContext = {
        currentDirectory: path.join(directory, currentDirectory),
        generatorDirectory,
      };
      for (const action of actions) {
        await action.execute(context);
      }
    }
  }
}
