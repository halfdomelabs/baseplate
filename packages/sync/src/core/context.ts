import { Action } from './action';

export interface GeneratorProviderContext {
  getProvider<T>(provider: string): T;
}

export interface GeneratorBuildContext {
  actions: Action[];
  getProvider<T>(provider: string): T;
  getOptionalProvider<T>(provider: string): T | null;
  addAction(action: Action): void;
}
