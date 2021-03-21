import { Action } from './action';

export interface GeneratorBuildContext {
  actions: Action[];
  addAction(action: Action): void;
}
