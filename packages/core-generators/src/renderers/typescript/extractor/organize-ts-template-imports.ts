import type { ResolverFactory } from 'oxc-resolver';
import type { SourceFile } from 'ts-morph';

import { camelCase } from 'es-toolkit';
import { isBuiltin } from 'node:module';
import path from 'node:path';
import { Node, Project, SyntaxKind } from 'ts-morph';

import type { TsImportDeclaration } from '../imports/index.js';
import type {
  TsProjectExport,
  TsProjectExportMap,
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
 * Resolves a module specifier to an absolute path, applying the validations shared
 * by both the binding-import and side-effect-import paths.
 *
 * @returns The resolved absolute path, or undefined if the import should be left untouched
 * (builtins and packages that only ship types).
 */
async function resolveTemplateImport(
  moduleSpecifier: string,
  filePath: string,
  resolver: ResolverFactory,
  outputDirectory: string,
  workspacePackageDirectories: string[],
): Promise<string | undefined> {
  if (isBuiltin(moduleSpecifier)) {
    return undefined;
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
        return undefined;
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
        `Example: Wrap the usage with delimited variables like /* TPL_VAR:START */identifier/* TPL_VAR:END */ and pass TsCodeUtils.importFragment() in the generator.`,
    );
  }

  return resolvedPath;
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
  {
    projectExportMap,
    internalOutputRelativePaths,
    resolver,
    outputDirectory,
    workspacePackageDirectories,
  }: TsTemplateImportLookupContext,
  referencedGeneratorTemplates: Set<string>,
): Promise<void> {
  for (const declaration of getSideEffectImportsFromSourceFile(sourceFile)) {
    const moduleSpecifier = declaration.getModuleSpecifier().getLiteralValue();

    // Specifiers that were variablized cannot be resolved on disk
    if (TEMPLATE_VARIABLE_SPECIFIER_REGEX.test(moduleSpecifier)) {
      continue;
    }

    const resolvedPath = await resolveTemplateImport(
      moduleSpecifier,
      filePath,
      resolver,
      outputDirectory,
      workspacePackageDirectories,
    );

    // Builtins and type-only packages are left untouched
    if (!resolvedPath) continue;

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
  usedProjectExports: TsProjectExport[];
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
  {
    projectExportMap,
    internalOutputRelativePaths,
    resolver,
    outputDirectory,
    workspacePackageDirectories,
  }: TsTemplateImportLookupContext,
): Promise<OrganizeTsTemplateImportsResult> {
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

  const usedProjectExports: TsProjectExport[] = [];
  const referencedGeneratorTemplates = new Set<string>();

  // Side effect imports are validated in place since their evaluation order matters
  await organizeSideEffectImports(
    sourceFile,
    filePath,
    {
      projectExportMap,
      internalOutputRelativePaths,
      resolver,
      outputDirectory,
      workspacePackageDirectories,
    },
    referencedGeneratorTemplates,
  );

  const updatedImportDeclarations = await Promise.all(
    tsImportDeclarations.map(async (importDeclaration) => {
      const { moduleSpecifier } = importDeclaration;
      const resolvedPath = await resolveTemplateImport(
        moduleSpecifier,
        filePath,
        resolver,
        outputDirectory,
        workspacePackageDirectories,
      );
      // Builtins and type-only packages are left untouched
      if (!resolvedPath) {
        return [importDeclaration];
      }

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
        throw new Error(
          `Import ${moduleSpecifier} in ${filePath} cannot be a namespace import since it are not supported currently
          for template extraction.`,
        );
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
