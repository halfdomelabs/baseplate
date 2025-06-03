import type { SourceFile } from 'ts-morph';

import path from 'node:path';
import { ModuleResolutionKind } from 'ts-morph';

import type { MorpherContext } from '#src/types.js';

import type { ResolveModuleOptions } from './normalize-module-specifier.js';

import { normalizeModuleSpecifier } from './normalize-module-specifier.js';

/**
 * Moves a file from one path to another
 * @param sourceFile The source file to move
 * @param targetFilePath The target path to move the file to
 */
export function moveFile(
  sourceFile: SourceFile,
  targetFilePath: string,
  { packageDirectory }: MorpherContext,
): void {
  const currentFilePath = sourceFile.getFilePath();
  if (currentFilePath === targetFilePath) {
    return;
  }

  const project = sourceFile.getProject();
  const isNode16 =
    project.getCompilerOptions().moduleResolution ===
      ModuleResolutionKind.Node16 ||
    project.getCompilerOptions().moduleResolution ===
      ModuleResolutionKind.NodeNext;
  const resolveModuleOptions: ResolveModuleOptions = {
    moduleResolution: isNode16 ? 'node16' : 'node',
    pathMapEntries: Object.entries(
      project.getCompilerOptions().paths ?? {},
    ).map(([from, to]) => ({
      from,
      to: to[0],
    })),
  };

  const referencingFiles = sourceFile.getReferencingSourceFiles();
  for (const referencingFile of referencingFiles) {
    const targetModuleSpecifier = normalizeModuleSpecifier(
      `@/${path.relative(packageDirectory, targetFilePath.replace(/\.tsx?$/, isNode16 ? '.js' : ''))}`,
      path.dirname(
        path.relative(packageDirectory, referencingFile.getFilePath()),
      ),
      resolveModuleOptions,
    );
    // fix import statements
    const importStatements = referencingFile.getImportDeclarations();
    for (const importStatement of importStatements) {
      const importSpecifier = importStatement.getModuleSpecifierSourceFile();
      if (importSpecifier?.getFilePath() === currentFilePath) {
        importStatement.setModuleSpecifier(targetModuleSpecifier);
      }
    }

    // fix export statements
    const exportStatements = referencingFile.getExportDeclarations();
    for (const exportStatement of exportStatements) {
      const exportSpecifier = exportStatement.getModuleSpecifierSourceFile();
      if (exportSpecifier?.getFilePath() === currentFilePath) {
        exportStatement.setModuleSpecifier(targetModuleSpecifier);
      }
    }

    referencingFile.saveSync();
  }

  project.getFileSystem().moveSync(currentFilePath, targetFilePath);
  project.removeSourceFile(sourceFile);
  project.addSourceFileAtPath(targetFilePath);
}
