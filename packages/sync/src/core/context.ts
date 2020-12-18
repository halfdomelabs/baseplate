import { Action } from './action';

export interface GeneratorContext {
  actions: Action[];
  directory: string;
  getProvider<T>(provider: string): T;
  addAction(action: Action): void;
}
