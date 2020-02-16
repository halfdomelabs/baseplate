export interface Descriptor {
  module: string;
  name: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface Action {
  name: string;
  displayName: string;
  description: string;
  execute: (rootDirectory: string) => Promise<void>;
}
