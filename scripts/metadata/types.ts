export interface PackageJson {
  name: string;
  version: string;
  type?: string;
  description?: string;
  keywords?: string[];
  author?: string;
  license?: string;
  repository?: any;
  bugs?: any;
  homepage?: string;
  engines?: any;
  volta?: any;
  main?: string;
  module?: string;
  exports?: any;
  types?: string;
  files?: string[];
  bin?: any;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  publishConfig?: any;
  [key: string]: any;
}