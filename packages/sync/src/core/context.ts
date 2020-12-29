import { Action } from './action';
import { ProviderType } from './provider';

export interface GeneratorProviderContext {
  getProvider<T>(provider: string): T;
}

export interface GeneratorBuildContext {
  actions: Action[];
  getProvider<T>(provider: string | ProviderType<T>): T;
  getOptionalProvider<T>(provider: string | ProviderType<T>): T | null;
  addAction(action: Action): void;
}
