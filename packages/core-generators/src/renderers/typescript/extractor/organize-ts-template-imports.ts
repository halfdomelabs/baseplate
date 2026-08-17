import type { ResolverFactory } from 'oxc-resolver';
import type { SourceFile } from 'ts-morph';

import { camelCase } from 'es-toolkit';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

import type { TsImportDeclaration } from '../imports/index.js';
import type {
  DeclaredPackageImportEntry,
  DeclaredPackageImportMap,
} from './build-declared-package-imports-map.js';
import type {
  TsProjectExportMap,
  TsResolvedProjectExport,
} from './build-ts-project-export-map.js';

import { mergeTsImportDeclarations } from '../imports/merge-ts-import-declarations.js';
import { sortImportDeclarations } from '../imports/sort-imports/sort-import-declarations.js';
import {
  getSideEffectImportsFromSourceFile,
  getTsMorphImportDeclarationsFromSourceFile,
  replaceImportDeclarationsInSourceFile,
} from '../imports/ts-morph-operations.js';

export interface TsTemplateImportLookupContext {
  /**
   * A map of output relative paths to a map of export names to project exports.
   */
  projectExportMap: TsProjectExportMap;
  /**
   * The absolute path of the output directory.
   */
  outputDirectory: string;
  /**
   * The absolute paths of every workspace package directory in the project being
   * extracted from (e.g. every `apps/*` and `libs/*`), not just `outputDirectory`.
   * Used to detect literal imports from a sibling workspace package that should be
   * parameterized instead of baked into the template.
   */
  workspacePackageDirectories: string[];
  /**
   * A map of literal cross-package module specifiers (e.g. `@my-project/ui-shared`) to the
   * import provider backing them, declared during sync via `registerPackageImportProvider`.
   * Imports matching an entry are rewritten to the provider's placeholder rather than rejected.
   */
  declaredPackageImportMap: DeclaredPackageImportMap;
  /**
   * A map of output relative paths to the name of the template in the generator.
   */
  internalOutputRelativePaths: Map<string, string>;
  /**
   * The resolver factory to use to resolve imports.
   */
  resolver: ResolverFactory;
}

/**
 * Detects if an import is to a workspace package that should be variablized
 */
function isWorkspacePackageImport(
  moduleSpecifier: string,
  resolvedPath: string,
  outputDirectory: string,
  workspacePackageDirectories: string[],
): boolean {
  // Check if it's a scoped package import
  if (!moduleSpecifier.startsWith('@')) {
    return false;
  }

  if (resolvedPath.startsWith(outputDirectory)) {
    // Check if it's in a workspace package location (libs/, packages/, apps/)
    // nested inside the app being extracted.
    const relativePath = path.relative(outputDirectory, resolvedPath);
    return (
      relativePath.startsWith('libs/') ||
      relativePath.startsWith('packages/') ||
      relativePath.startsWith('apps/')
    );
  }

  // Otherwise, check if it resolves into a *sibling* workspace package of the
  // same project (e.g. a workspace-local lib imported by its literal package
  // name) rather than a real external npm package. One of the workspace
  // directories may be the project root itself (which contains every
  // package's node_modules), so a real npm package resolving through
  // node_modules must still be excluded even though its path is nested
  // under that directory.
  return workspacePackageDirectories.some((dir) => {
    if (dir === outputDirectory || !resolvedPath.startsWith(dir)) {
      return false;
    }
    const relativePath = path.relative(dir, resolvedPath);
    return !relativePath.split(path.sep).includes('node_modules');
  });
}

/**
 * Collects all Identifier names from a SourceFile,
 * skipping nodes within ImportDeclaration structures.
 */
function collectUsedIdentifierNames(sourceFile: SourceFile): Set<string> {
  const usedIdentifiers = new Set<string>();

  sourceFile.forEachDescendant((node, traversal) => {
    if (node.isKind(SyntaxKind.ImportDeclaration)) {
      traversal.skip();
      return;
    }

    if (Node.isIdentifier(node)) {
      usedIdentifiers.add(node.getText());
    }
  });

  return usedIdentifiers;
}

const PACKAGE_REGEX =
  /^(?:@([a-z0-9-~][a-z0-9-._~]*)\/)?([a-z0-9-~][a-z0-9-._~]*)$/;

/**
 * Matches module specifiers that contain a template variable placeholder, e.g.
 * `TPL_MODULE_PATH`, left behind by extractTsTemplateVariables. These cannot be
 * resolved against the filesystem so they are skipped during validation.
 */
const TEMPLATE_VARIABLE_SPECIFIER_REGEX = /TPL_[A-Z0-9_]+/;

/**
 * Converts an NPM package name to its corresponding @types package name.
 */
function toTypesPackageName(pkgName: string): string | undefined {
  if (!PACKAGE_REGEX.test(pkgName)) {
    return undefined;
  }
  if (pkgName.startsWith('@')) {
    const [scope, name] = pkgName.slice(1).split('/');
    return `@types/${scope}__${name}`;
  }
  return `@types/${pkgName}`;
}

/**
 * The outcome of resolving a module specifier in a template file.
 *
 * - `skip`: leave the import untouched (builtins and packages that only ship types)
 * - `path`: the import resolved to a file on disk
 * - `declaredPackageImport`: the import is a cross-package import declared during sync
 */
type ResolvedTemplateImport =
  | { kind: 'skip' }
  | { kind: 'path'; resolvedPath: string }
  | { kind: 'declaredPackageImport'; entry: DeclaredPackageImportEntry };

/**
 * Resolves a module specifier, applying the validations shared by both the binding-import
 * and side-effect-import paths.
 *
 * Declared cross-package imports are matched before touching the filesystem, so extraction does
 * not depend on the sibling package having been built.
 */
async function resolveTemplateImport(
  moduleSpecifier: string,
  filePath: string,
  {
    resolver,
    outputDirectory,
    workspacePackageDirectories,
    declaredPackageImportMap,
  }: TsTemplateImportLookupContext,
): Promise<ResolvedTemplateImport> {
  if (isBuiltin(moduleSpecifier)) {
    return { kind: 'skip' };
  }

  const declaredPackageImport = declaredPackageImportMap.get(moduleSpecifier);
  if (declaredPackageImport) {
    return { kind: 'declaredPackageImport', entry: declaredPackageImport };
  }

  const resolutionResult = await resolver.async(
    path.dirname(filePath),
    moduleSpecifier,
  );

  if (!resolutionResult.path) {
    // It's possible that it's a type only import, so we should check for the @types import
    const typesPackageName = toTypesPackageName(moduleSpecifier);
    if (typesPackageName) {
      const typesResolutionResult = await resolver.async(
        path.dirname(filePath),
        typesPackageName,
      );
      if (typesResolutionResult.path) {
        return { kind: 'skip' };
      }
    }

    throw new Error(
      `Could not resolve import ${moduleSpecifier} in ${filePath}: ${String(resolutionResult.error)}`,
    );
  }

  const resolvedPath = resolutionResult.path;

  if (
    isWorkspacePackageImport(
      moduleSpecifier,
      resolvedPath,
      outputDirectory,
      workspacePackageDirectories,
    )
  ) {
    throw new Error(
      `Workspace package import "${moduleSpecifier}" in ${filePath} must be configured as a project export or converted to a template variable. ` +
        `Template imports should use TPL_* variables for dynamic package references. ` +
        `Example: Wrap the usage with delimited variables like /* TPL_VAR:START */identifier/* TPL_VAR:END */ and pass TsCodeUtils.importFragment() in the generator. ` +
        `Alternatively, if the package is generated by this project, have the generator that wires it up declare it with registerPackageImportProvider().`,
    );
  }

  return { kind: 'path', resolvedPath };
}

/**
 * Looks up a symbol imported from a declared cross-package module specifier.
 */
function getDeclaredPackageProjectExport(
  entry: DeclaredPackageImportEntry,
  exportedName: string,
  filePath: string,
): TsResolvedProjectExport {
  const projectExport = entry.projectExports.get(exportedName);
  if (!projectExport) {
    throw new Error(
      `Import { ${exportedName} } from "${entry.moduleSpecifier}" in ${filePath} is not a project export of ${entry.generatorName}. ` +
        `Only symbols exposed by that generator's import provider can be resolved across packages.`,
    );
  }
  return projectExport;
}

/**
 * Validates side-effect imports (e.g. `import './foo.js';`) and rewrites those that point
 * at another template in the same generator to its internal `$templateName` specifier.
 *
 * Side-effect imports are rewritten in place rather than through the sort-and-replace path
 * because their evaluation order is semantically significant.
 *
 * Throws when an import resolves inside the output directory but is not a known template or
 * project export, which means project-specific code would otherwise be baked into the template.
 */
async function organizeSideEffectImports(
  sourceFile: SourceFile,
  filePath: string,
  context: TsTemplateImportLookupContext,
  referencedGeneratorTemplates: Set<string>,
): Promise<void> {
  const { projectExportMap, internalOutputRelativePaths, outputDirectory } =
    context;
  for (const declaration of getSideEffectImportsFromSourceFile(sourceFile)) {
    const moduleSpecifier = declaration.getModuleSpecifier().getLiteralValue();

    // Specifiers that were variablized cannot be resolved on disk
    if (TEMPLATE_VARIABLE_SPECIFIER_REGEX.test(moduleSpecifier)) {
      continue;
    }

    const resolved = await resolveTemplateImport(
      moduleSpecifier,
      filePath,
      context,
    );

    // Builtins and type-only packages are left untouched
    if (resolved.kind === 'skip') continue;

    if (resolved.kind === 'declaredPackageImport') {
      throw new Error(
        `Side-effect import "${moduleSpecifier}" in ${filePath} points at a cross-package import provider, which exposes named symbols rather than side effects. ` +
          `Move the import inside the enclosing TPL_* region so it is generated.`,
      );
    }

    const { resolvedPath } = resolved;

    // Don't modify external imports outside the project root
    if (!resolvedPath.startsWith(outputDirectory)) continue;

    const relativeOutputPath = path.relative(outputDirectory, resolvedPath);
    const internalTemplateName =
      internalOutputRelativePaths.get(relativeOutputPath);

    if (internalTemplateName) {
      referencedGeneratorTemplates.add(internalTemplateName);
      declaration.setModuleSpecifier(`$${camelCase(internalTemplateName)}`);
      continue;
    }

    if (!projectExportMap.has(relativeOutputPath)) {
      throw new Error(
        `Side-effect import ${moduleSpecifier} in ${filePath} resolves to ${relativeOutputPath} which is not a template in this generator or a project export. ` +
          `This is usually project-specific code that would be baked into a shared template. ` +
          `Move the import inside the enclosing TPL_* region so it is generated, or register the file with the generator.`,
      );
    }
  }
}

/**
 * Builds the error thrown when a template file imports a namespace binding.
 */
function createNamespaceImportError(
  moduleSpecifier: string,
  filePath: string,
): Error {
  return new Error(
    `Import ${moduleSpecifier} in ${filePath} cannot be a namespace import since namespace imports are not supported for template extraction.`,
  );
}

/**
 * Rewrites an import from a declared cross-package module specifier to the placeholder specifier
 * of the import provider backing it, recording the project exports it consumed.
 */
function resolveDeclaredPackageImportDeclaration(
  entry: DeclaredPackageImportEntry,
  importDeclaration: TsImportDeclaration,
  filePath: string,
  usedProjectExports: TsResolvedProjectExport[],
): TsImportDeclaration[] {
  const { moduleSpecifier } = importDeclaration;

  if (importDeclaration.namespaceImport) {
    throw createNamespaceImportError(moduleSpecifier, filePath);
  }

  const importDeclarations: TsImportDeclaration[] = [];
  const { defaultImport } = importDeclaration;
  if (defaultImport) {
    const projectExport = getDeclaredPackageProjectExport(
      entry,
      'default',
      filePath,
    );
    if (projectExport.isTypeOnly && !importDeclaration.isTypeOnly) {
      throw new Error(
        `Default import from ${moduleSpecifier} in ${filePath} is not a type only import but the project export is a type only import.`,
      );
    }
    usedProjectExports.push(projectExport);
    importDeclarations.push({
      namedImports: [{ name: projectExport.name }],
      moduleSpecifier: projectExport.placeholderModuleSpecifier,
      isTypeOnly: projectExport.isTypeOnly,
    });
  }

  importDeclarations.push(
    ...(importDeclaration.namedImports ?? []).map((namedImport) => {
      const projectExport = getDeclaredPackageProjectExport(
        entry,
        namedImport.name,
        filePath,
      );
      const isTypeOnly =
        (importDeclaration.isTypeOnly ?? false) ||
        (namedImport.isTypeOnly ?? false);
      if (!isTypeOnly && projectExport.isTypeOnly) {
        throw new Error(
          `Import ${namedImport.name} from ${moduleSpecifier} in ${filePath} is not a type only import but the project export is a type only import.`,
        );
      }
      usedProjectExports.push(projectExport);
      return {
        namedImports: [namedImport],
        moduleSpecifier: projectExport.placeholderModuleSpecifier,
        isTypeOnly,
      };
    }),
  );

  return importDeclarations;
}

/**
 * The result of organizing the imports in a Typescript template file.
 */
interface OrganizeTsTemplateImportsResult {
  /**
   * The contents of the file with the imports converted to template paths.
   */
  contents: string;
  /**
   * The project exports that are used in the file.
   */
  usedProjectExports: TsResolvedProjectExport[];
  /**
   * The generator files that are used in the file.
   */
  referencedGeneratorTemplates: Set<string>;
}

/**
 * Organizes the imports in a Typescript template file.
 * - Removes unused imports
 * - Replaces import declarations with new import declarations in the projectExportMap
 * - Sorts the imports
 * - Writes the imports to the file
 *
 * @param filePath - The path to the file to organize
 * @param contents - The contents of the file to organize
 * @param context - The context for the template import lookup
 * @returns The organized contents of the file
 */
export async function organizeTsTemplateImports(
  filePath: string,
  contents: string,
  context: TsTemplateImportLookupContext,
): Promise<OrganizeTsTemplateImportsResult> {
  const { projectExportMap, internalOutputRelativePaths, outputDirectory } =
    context;
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(filePath, contents);

  // Replace import declarations with new import declarations
  const importDeclarations =
    getTsMorphImportDeclarationsFromSourceFile(sourceFile);

  // Filter out import declarations that are not used
  // Note: This is a rudimentary implementation that has a known issue
  // where it will incorrectly identify a used import if the identifier
  // has been declared in a different scope, e.g.
  // import { foo } from './foo';
  // const foo = 'foo';
  //
  // In this case, the import { foo } is incorrectly identified as used.
  // The proper way is to check if the identifier has been used. However,
  // this comes with a significant performance penalty so we should only use
  // this if we can't use collectUsedIdentifierNames.

  const usedIdentifierNames = collectUsedIdentifierNames(sourceFile);

  const isNodeUsed = (node: Node | undefined): node is Node => {
    if (!node) {
      return false;
    }
    const name =
      (Node.isImportSpecifier(node)
        ? (node.getAliasNode()?.getText() ?? node.getName())
        : undefined) ?? node.getText();
    return usedIdentifierNames.has(name);
  };

  const tsImportDeclarations = importDeclarations
    .map((declaration) => {
      const namespaceImport = declaration.getNamespaceImport();
      const defaultImport = declaration.getDefaultImport();
      return {
        moduleSpecifier: declaration.getModuleSpecifier().getLiteralValue(),
        isTypeOnly: declaration.isTypeOnly(),
        namespaceImport: isNodeUsed(namespaceImport)
          ? namespaceImport.getText()
          : undefined,
        defaultImport: isNodeUsed(defaultImport)
          ? defaultImport.getText()
          : undefined,
        namedImports: declaration
          .getNamedImports()
          .filter((namedImport) => isNodeUsed(namedImport))
          .map((namedImport) => ({
            name: namedImport.getName(),
            alias: namedImport.getAliasNode()?.getText(),
            isTypeOnly: namedImport.isTypeOnly(),
          })),
      };
    })
    .filter(
      (importDeclaration) =>
        importDeclaration.defaultImport ??
        importDeclaration.namespaceImport ??
        importDeclaration.namedImports.length > 0,
    );

  const usedProjectExports: TsResolvedProjectExport[] = [];
  const referencedGeneratorTemplates = new Set<string>();

  // Side effect imports are validated in place since their evaluation order matters
  await organizeSideEffectImports(
    sourceFile,
    filePath,
    context,
    referencedGeneratorTemplates,
  );

  const updatedImportDeclarations = await Promise.all(
    tsImportDeclarations.map(async (importDeclaration) => {
      const { moduleSpecifier } = importDeclaration;
      const resolved = await resolveTemplateImport(
        moduleSpecifier,
        filePath,
        context,
      );
      // Builtins and type-only packages are left untouched
      if (resolved.kind === 'skip') {
        return [importDeclaration];
      }

      if (resolved.kind === 'declaredPackageImport') {
        return resolveDeclaredPackageImportDeclaration(
          resolved.entry,
          importDeclaration,
          filePath,
          usedProjectExports,
        );
      }

      const { resolvedPath } = resolved;

      // Don't modify external imports outside the project root
      if (!resolvedPath.startsWith(outputDirectory)) {
        return [importDeclaration];
      }
      // Don't modify imports for files in the generator
      const relativeOutputPath = path.relative(outputDirectory, resolvedPath);
      const internalTemplateName =
        internalOutputRelativePaths.get(relativeOutputPath);
      if (internalTemplateName) {
        referencedGeneratorTemplates.add(internalTemplateName);
        const fixedImportDeclaration: TsImportDeclaration = {
          ...importDeclaration,
          // convert to internal template name
          moduleSpecifier: `$${camelCase(internalTemplateName)}`,
        };
        return [fixedImportDeclaration];
      }
      if (importDeclaration.namespaceImport) {
        throw createNamespaceImportError(moduleSpecifier, filePath);
      }
      // look up the corresponding import in the project exports
      const pathExports = projectExportMap.get(relativeOutputPath);
      if (!pathExports) {
        throw new Error(
          `Import ${relativeOutputPath} in ${filePath} is not found in the project exports.`,
        );
      }
      const importDeclarations: TsImportDeclaration[] = [];
      const { defaultImport } = importDeclaration;
      if (defaultImport) {
        const projectExport =
          pathExports.get('default') ?? pathExports.get('*');
        if (!projectExport) {
          throw new Error(
            `Default import from ${moduleSpecifier} in ${filePath} is not found in the project exports.`,
          );
        }
        if (projectExport.isTypeOnly && !importDeclaration.isTypeOnly) {
          throw new Error(
            `Default import from ${moduleSpecifier} in ${filePath} is not a type only import but the project export is a type only import.`,
          );
        }
        usedProjectExports.push(projectExport);
        importDeclarations.push({
          namedImports: [{ name: projectExport.name }],
          moduleSpecifier: projectExport.placeholderModuleSpecifier,
          isTypeOnly: projectExport.isTypeOnly,
        });
      }
      importDeclarations.push(
        ...importDeclaration.namedImports.map((namedImport) => {
          const projectExport =
            pathExports.get(namedImport.name) ?? pathExports.get('*');
          if (!projectExport) {
            throw new Error(
              `Import { ${namedImport.name} } from ${moduleSpecifier} in ${filePath} is not found in the project exports.`,
            );
          }
          const isTypeOnly =
            importDeclaration.isTypeOnly || namedImport.isTypeOnly;
          if (!isTypeOnly && projectExport.isTypeOnly) {
            throw new Error(
              `Import ${namedImport.name} from ${moduleSpecifier} in ${filePath} is not a type only import but the project export is a type only import.`,
            );
          }
          usedProjectExports.push(projectExport);
          return {
            namedImports: [namedImport],
            moduleSpecifier: projectExport.placeholderModuleSpecifier,
            isTypeOnly,
          };
        }),
      );
      return importDeclarations;
    }),
  );

  const mergedImportDeclarations = mergeTsImportDeclarations(
    updatedImportDeclarations.flat(),
  );
  const sortedImportDeclarations = sortImportDeclarations(
    mergedImportDeclarations,
    {},
  );

  replaceImportDeclarationsInSourceFile(
    sourceFile,
    importDeclarations,
    sortedImportDeclarations,
  );

  return {
    contents: sourceFile.getFullText(),
    usedProjectExports,
    referencedGeneratorTemplates,
  };
}
