import { ZodPluginImplementationStore } from './store.js';

export const zodPluginSymbol = Symbol('zod-plugin');

export interface ZodPluginContext {
  pluginStore: ZodPluginImplementationStore;
}
