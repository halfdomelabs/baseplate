import type { ImportDeclaration } from 'ts-morph';

import { Node, SyntaxKind } from 'ts-morph';
import z from 'zod';

import { createTypescriptMorpher } from '#src/types.js';

import { addOrUpdateImport } from './utils/imports.js';

export default createTypescriptMorpher({
  name: 'convert-subcomponent-references',
  description:
    'Converts subcomponent references (e.g. Alert.Title) to standalone component references (e.g. AlertTitle)',
  pathGlobs: ['**/*.tsx'],
  options: {
    componentName: {
      description: 'The name of the main component to look for (e.g. "Alert")',
      optional: false,
      validation: z.string(),
    },
  },
  transform: (sourceFile, options) => {
    const { componentName } = options;
    const subcomponentReferences = new Set<string>();

    // First check if the component is imported
    let mainComponentImport: ImportDeclaration | undefined;
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        if (namedImport.getName() === componentName) {
          mainComponentImport = importDecl;
          break;
        }
      }
      if (mainComponentImport) break;
    }

    if (!mainComponentImport) {
      return;
    }

    // Find all property access expressions and identifier references in the file
    const propertyAccessExpressions = sourceFile.getDescendantsOfKind(
      SyntaxKind.PropertyAccessExpression,
    );
    const identifierReferences = sourceFile.getDescendantsOfKind(
      SyntaxKind.Identifier,
    );

    // Check for direct usage of the main component
    let isMainComponentUsedDirectly = false;
    for (const identifier of identifierReferences) {
      if (identifier.getText() === componentName) {
        // Skip if this identifier is part of a property access expression
        const parent = identifier.getParent();
        if (
          Node.isPropertyAccessExpression(parent) ||
          Node.isImportSpecifier(parent)
        ) {
          continue;
        }
        isMainComponentUsedDirectly = true;
        break;
      }
    }

    // Process property access expressions
    for (const expr of propertyAccessExpressions) {
      const expression = expr.getExpression();
      if (expression.getText() === componentName) {
        const propertyName = expr.getName();
        const subcomponentName = `${componentName}${propertyName}`;
        subcomponentReferences.add(subcomponentName);

        // Replace the property access with the standalone component name
        expr.replaceWithText(subcomponentName);
      }
    }

    // Remove the main component import if it's no longer used
    if (!isMainComponentUsedDirectly) {
      const namedImports = mainComponentImport.getNamedImports();
      if (namedImports.length === 1) {
        mainComponentImport.remove();
      } else {
        // Remove just the main component from the named imports
        for (const namedImport of namedImports) {
          if (namedImport.getName() === componentName) {
            namedImport.remove();
            break;
          }
        }
      }
    }

    // Add imports for all the subcomponents we found
    if (subcomponentReferences.size > 0) {
      addOrUpdateImport(sourceFile, '@halfdomelabs/ui-components', [
        ...subcomponentReferences,
      ]);
    }

    return;
  },
});
