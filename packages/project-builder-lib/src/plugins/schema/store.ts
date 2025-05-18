import type { PluginSpec, PluginSpecImplementation } from '../spec/types.js';

export class PluginImplementationStore {
  constructor(
    public implementations: Partial<Record<string, PluginSpecImplementation>>,
  ) {}

  getPluginSpec<TImplementation>(
    spec: PluginSpec<TImplementation>,
  ): TImplementation {
    const implementation = this.implementations[spec.name] as TImplementation;

    if (!implementation) {
      throw new Error(`Unable to find implementation for spec ${spec.name}`);
    }

    return implementation;
  }

  getPluginSpecOptional<TImplementation>(
    spec: PluginSpec<TImplementation>,
  ): TImplementation | undefined {
    return this.implementations[spec.name] as TImplementation | undefined;
  }
}
