import { Schema } from 'yup';

export interface Descriptor {
  module: string;
  name: string;
}

export interface Module<T extends Descriptor> {
  name: string;
  buildDependencies?: string[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  descriptorSchema?: {
    [K in keyof Exclude<T, Descriptor>]: Schema<Exclude<T, Descriptor>[K]>;
  };
  parseDescriptor?: (data: T) => Promise<T>;
  build?: (descriptor: T, directory: string) => Action[];
}

export interface Action {
  name: string;
  displayName: string;
  description: string;
  execute: (rootDirectory: string) => Promise<void>;
}
