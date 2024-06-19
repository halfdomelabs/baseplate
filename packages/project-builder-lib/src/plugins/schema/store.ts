import { PluginSpec, PluginSpecImplementation } from '../spec/types.js';

export class ZodPluginImplementationStore {
  constructor(
    public implementations: Record<string, PluginSpecImplementation>,
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
}
