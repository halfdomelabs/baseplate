import type { ResolverFactory } from 'oxc-resolver';
import type { Identifier } from 'ts-morph';

import path from 'node:path';
import { Project, StringLiteral } from 'ts-morph';

import type { TsImportDeclaration } from '../imports/index.js';
import type { TsProjectExport } from './write-ts-project-exports.js';

import { writeGroupedImportDeclarationsWithCodeBlockWriter } from '../imports/index.js';
import { mergeTsImportDeclarations } from '../imports/merge-ts-import-declarations.js';
import { sortImportDeclarations } from '../imports/sort-imports/sort-import-declarations.js';
import { getTsMorphImportDeclarationsFromSourceFile } from '../imports/ts-morph-operations.js';

// Map of project relative path to a map of import name to project export
export type ProjectExportLookupMap = Map<string, Map<string, TsProjectExport>>;

export interface TsTemplateImportLookupContext {
  projectExportMap: ProjectExportLookupMap;
  projectRoot: string;
  generatorFiles: string[];
  resolver: ResolverFactory;
}

function isIdentifierUsed(
  node: Identifier | undefined | StringLiteral,
): node is Identifier {
  if (node instanceof StringLiteral) {
    return false;
  }
  return node !== undefined && node.findReferencesAsNodes().length > 1;
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
    generatorFiles,
    resolver,
    projectRoot,
  }: TsTemplateImportLookupContext,
): Promise<{
  contents: string;
  usedProjectExports: TsProjectExport[];
}> {
  const project = new Project({ useInMemoryFileSystem: true });
  const sourceFile = project.createSourceFile(filePath, contents);

  // Replace import declarations with new import declarations
  const importDeclarations =
    getTsMorphImportDeclarationsFromSourceFile(sourceFile);

  // Filter out import declarations that are not used
  const tsImportDeclarations = importDeclarations
    .map((declaration) => {
      const namespaceImport = declaration.getNamespaceImport();
      const defaultImport = declaration.getDefaultImport();
      return {
        source: declaration.getModuleSpecifier().getLiteralValue(),
        isTypeOnly: declaration.isTypeOnly(),
        namespaceImport: isIdentifierUsed(namespaceImport)
          ? namespaceImport.getText()
          : undefined,
        defaultImport: isIdentifierUsed(defaultImport)
          ? defaultImport.getText()
          : undefined,
        namedImports: declaration
          .getNamedImports()
          .filter((namedImport) =>
            isIdentifierUsed(
              namedImport.getAliasNode() ?? namedImport.getNameNode(),
            ),
          )
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

  const updatedImportDeclarations = await Promise.all(
    tsImportDeclarations.map(async (importDeclaration) => {
      const { source } = importDeclaration;
      const resolutionResult = await resolver.async(
        path.dirname(filePath),
        source,
      );
      if (!resolutionResult.path) {
        throw new Error(
          `Could not resolve import ${source} in ${filePath}: ${String(resolutionResult.error)}`,
        );
      }
      const resolvedPath = resolutionResult.path;
      // Don't modify external imports outside the project root
      if (!resolvedPath.startsWith(projectRoot)) {
        return [importDeclaration];
      }
      // Don't modify imports for files in the generator
      if (generatorFiles.includes(resolvedPath)) {
        const relativeImportPath = path
          .relative(path.dirname(filePath), resolvedPath)
          .replace(/\.(t|j)sx?$/, '.js');
        const fixedImportDeclaration: TsImportDeclaration = {
          ...importDeclaration,
          // convert to relative path
          source: relativeImportPath.startsWith('.')
            ? relativeImportPath
            : `./${relativeImportPath}`,
        };
        return [fixedImportDeclaration];
      }
      if (
        importDeclaration.namespaceImport ||
        importDeclaration.defaultImport ||
        importDeclaration.namedImports.length === 0
      ) {
        throw new Error(
          `Import ${source} in ${filePath} cannot be a namespace or default import since they are not supported currently
          for template extraction.`,
        );
      }
      // look up the corresponding import in the project exports
      const pathExports = projectExportMap.get(resolvedPath);
      if (!pathExports) {
        throw new Error(
          `Import ${resolvedPath} in ${filePath} is not found in the project exports.`,
        );
      }
      return importDeclaration.namedImports.map((namedImport) => {
        const projectExport = pathExports.get(namedImport.name);
        if (!projectExport) {
          throw new Error(
            `Import ${namedImport.name} from ${source} in ${filePath} is not found in the project exports.`,
          );
        }
        usedProjectExports.push(projectExport);
        const isTypeOnly =
          !!importDeclaration.isTypeOnly || !!namedImport.isTypeOnly;
        if (!isTypeOnly && projectExport.isTypeOnly) {
          throw new Error(
            `Import ${namedImport.name} from ${source} in ${filePath} is not a type only import but the project export is a type only import.`,
          );
        }
        return {
          namedImports: [namedImport],
          source: projectExport.importSource,
          isTypeOnly,
        };
      });
    }),
  );
  for (const importDeclaration of importDeclarations) {
    importDeclaration.remove();
  }
  const mergedImportDeclarations = mergeTsImportDeclarations(
    updatedImportDeclarations.flat(),
  );
  const sortedImportDeclarations = sortImportDeclarations(
    mergedImportDeclarations,
    {},
  );
  sourceFile.insertText(0, (writer) => {
    writeGroupedImportDeclarationsWithCodeBlockWriter(
      writer,
      sortedImportDeclarations,
    );
  });

  return {
    contents: sourceFile.getFullText(),
    usedProjectExports,
  };
}
