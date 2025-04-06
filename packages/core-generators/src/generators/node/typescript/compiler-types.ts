// Copied from https://github.com/microsoft/TypeScript/blob/main/src/compiler/types.ts
// to avoid dependencies on ts-morph

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */

export enum JsxEmit {
  None = 'none',
  Preserve = 'preserve',
  ReactNative = 'react-native',
  React = 'react',
  ReactJSX = 'react-jsx',
  ReactJSXDev = 'react-jsxdev',
}

export enum ModuleKind {
  None = 'none',
  CommonJS = 'commonjs',
  AMD = 'amd',
  UMD = 'umd',
  System = 'system',
  ES6 = 'es6',
  ES2015 = 'es2015',
  ES2020 = 'es2020',
  ES2022 = 'es2022',
  ESNext = 'esnext',
  Node16 = 'node16',
  NodeNext = 'nodenext',
  Preserve = 'preserve',
}

export enum ModuleResolutionKind {
  Classic = 'classic',
  Node10 = 'node10',
  Node16 = 'node16',
  NodeNext = 'nodenext',
  Bundler = 'bundler',
}

export enum ScriptTarget {
  /** @deprecated */
  ES3 = 'es3',
  ES5 = 'es5',
  ES6 = 'es6',
  ES2015 = 'es2015',
  ES2016 = 'es2016',
  ES2017 = 'es2017',
  ES2018 = 'es2018',
  ES2019 = 'es2019',
  ES2020 = 'es2020',
  ES2021 = 'es2021',
  ES2022 = 'es2022',
  ES2023 = 'es2023',
  ES2024 = 'es2024',
  ESNext = 'esnext',
  JSON = 'json',
}

type MapLike<T> = Record<string, T>;

export interface TypescriptCompilerOptions {
  allowImportingTsExtensions?: boolean;
  allowJs?: boolean;
  allowArbitraryExtensions?: boolean;
  allowSyntheticDefaultImports?: boolean;
  allowUmdGlobalAccess?: boolean;
  allowUnreachableCode?: boolean;
  allowUnusedLabels?: boolean;
  alwaysStrict?: boolean;
  baseUrl?: string;
  /** @deprecated */
  charset?: string;
  checkJs?: boolean;
  customConditions?: string[];
  declaration?: boolean;
  declarationMap?: boolean;
  emitDeclarationOnly?: boolean;
  declarationDir?: string;
  disableSizeLimit?: boolean;
  disableSourceOfProjectReferenceRedirect?: boolean;
  disableSolutionSearching?: boolean;
  disableReferencedProjectLoad?: boolean;
  downlevelIteration?: boolean;
  emitBOM?: boolean;
  emitDecoratorMetadata?: boolean;
  exactOptionalPropertyTypes?: boolean;
  experimentalDecorators?: boolean;
  forceConsistentCasingInFileNames?: boolean;
  ignoreDeprecations?: string;
  importHelpers?: boolean;
  inlineSourceMap?: boolean;
  inlineSources?: boolean;
  isolatedModules?: boolean;
  isolatedDeclarations?: boolean;
  jsx?: `${JsxEmit}`;
  lib?: string[];
  locale?: string;
  mapRoot?: string;
  maxNodeModuleJsDepth?: number;
  module?: `${ModuleKind}`;
  moduleResolution?: `${ModuleResolutionKind}`;
  moduleSuffixes?: string[];
  noEmit?: boolean;
  noCheck?: boolean;
  noEmitHelpers?: boolean;
  noEmitOnError?: boolean;
  noErrorTruncation?: boolean;
  noFallthroughCasesInSwitch?: boolean;
  noImplicitAny?: boolean;
  noImplicitReturns?: boolean;
  noImplicitThis?: boolean;
  /** @deprecated */
  noStrictGenericChecks?: boolean;
  noUnusedLocals?: boolean;
  noUnusedParameters?: boolean;
  /** @deprecated */
  noImplicitUseStrict?: boolean;
  noPropertyAccessFromIndexSignature?: boolean;
  assumeChangesOnlyAffectDirectDependencies?: boolean;
  noLib?: boolean;
  noResolve?: boolean;
  noUncheckedIndexedAccess?: boolean;
  /** @deprecated */
  out?: string;
  outDir?: string;
  outFile?: string;
  paths?: MapLike<string[]>;
  preserveConstEnums?: boolean;
  noImplicitOverride?: boolean;
  preserveSymlinks?: boolean;
  /** @deprecated */
  preserveValueImports?: boolean;
  project?: string;
  reactNamespace?: string;
  jsxFactory?: string;
  jsxFragmentFactory?: string;
  jsxImportSource?: string;
  composite?: boolean;
  incremental?: boolean;
  tsBuildInfoFile?: string;
  removeComments?: boolean;
  resolvePackageJsonExports?: boolean;
  resolvePackageJsonImports?: boolean;
  rewriteRelativeImportExtensions?: boolean;
  rootDir?: string;
  rootDirs?: string[];
  skipLibCheck?: boolean;
  skipDefaultLibCheck?: boolean;
  sourceMap?: boolean;
  sourceRoot?: string;
  strict?: boolean;
  strictFunctionTypes?: boolean;
  strictBindCallApply?: boolean;
  strictNullChecks?: boolean;
  strictPropertyInitialization?: boolean;
  strictBuiltinIteratorReturn?: boolean;
  stripInternal?: boolean;
  /** @deprecated */
  suppressExcessPropertyErrors?: boolean;
  /** @deprecated */
  suppressImplicitAnyIndexErrors?: boolean;
  target?: `${ScriptTarget}`;
  traceResolution?: boolean;
  useUnknownInCatchVariables?: boolean;
  noUncheckedSideEffectImports?: boolean;
  resolveJsonModule?: boolean;
  types?: string[];
  /** Paths used to compute primary types search locations */
  typeRoots?: string[];
  verbatimModuleSyntax?: boolean;
  esModuleInterop?: boolean;
  useDefineForClassFields?: boolean;
}
