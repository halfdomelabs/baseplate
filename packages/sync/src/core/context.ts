import { Action } from './action';

export type GeneratorProviderContext = {};

export interface GeneratorBuildContext {
  actions: Action[];
  addAction(action: Action): void;
}
