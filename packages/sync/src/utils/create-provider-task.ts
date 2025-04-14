import type {
  InferProviderDependency,
  ProviderDependency,
  ProviderType,
} from '@src/providers/providers.js';

import type { GeneratorTask } from '../generators/generators.js';

import { createGeneratorTask } from '../generators/generators.js';

/**
 * Create a generator task that depends on a single provider
 *
 * @param dependency - The dependency to run the task with
 * @param run - The function to run with the dependency
 * @returns A generator task that depends on the provider
 */
export function createProviderTask<
  TProviderType extends ProviderType | ProviderDependency,
>(
  dependency: TProviderType,
  run: (dependency: InferProviderDependency<TProviderType>) => void,
): GeneratorTask<undefined, { provider: TProviderType }, undefined> {
  return createGeneratorTask({
    dependencies: {
      provider: dependency,
    },
    run({ provider }) {
      run(provider as InferProviderDependency<TProviderType>);
    },
  });
}
