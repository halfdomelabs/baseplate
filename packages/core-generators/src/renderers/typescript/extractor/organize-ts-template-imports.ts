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
   * A map of output relative paths to the name of the template in the generator.
   */
  internalOutputRelativePaths: Map<string, string>;
  /**
   * The resolver factory to use to resolve imports.
   */
  resolver: ResolverFactory;
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

  const updatedImportDeclarations = await Promise.all(
    tsImportDeclarations.map(async (importDeclaration) => {
      const { moduleSpecifier } = importDeclaration;
      if (isBuiltin(moduleSpecifier)) {
        return [importDeclaration];
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
            return [importDeclaration];
          }
        }

        throw new Error(
          `Could not resolve import ${moduleSpecifier} in ${filePath}: ${String(resolutionResult.error)}`,
        );
      }
      const resolvedPath = resolutionResult.path;
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
            !!importDeclaration.isTypeOnly || !!namedImport.isTypeOnly;
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
