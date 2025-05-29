import type { PackageInfo } from '../utils/workspace.js';

export interface MetafileDefinition {
  fileName: string;
  shouldExist: (pkg: PackageInfo) => boolean;
  getContent: (pkg: PackageInfo) => string | object;
  format?: boolean;
  check?: (
    pkg: PackageInfo,
    actualContent: string,
    expectedContent: string,
  ) => string[];
}

export interface PackageJsonTemplate {
  author?: string;
  repository?: any;
  license?: string;
  engines?: any;
  volta?: any;
  publishConfig?: any;
  scripts?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface GeneratePackageOptions {
  name: string;
  description: string;
  packageType: 'plugin' | 'library' | 'app';
  useReact: boolean;
  useTypeScript: boolean;
}
