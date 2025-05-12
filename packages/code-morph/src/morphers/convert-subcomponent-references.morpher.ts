import { ts } from 'ts-morph';
import z from 'zod';

import { createTypescriptMorpher } from '@src/types.js';

import { addOrUpdateImport } from './utils/imports.js';

export default createTypescriptMorpher({
  name: 'convert-subcomponent-references',
  description:
    'Converts subcomponent references (e.g. Alert.Title) to standalone component references (e.g. AlertTitle)',
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
    let isComponentImported = false;
    for (const importDecl of sourceFile.getImportDeclarations()) {
      const namedImports = importDecl.getNamedImports();
      for (const namedImport of namedImports) {
        if (namedImport.getName() === componentName) {
          isComponentImported = true;
          break;
        }
      }
      if (isComponentImported) break;
    }

    if (!isComponentImported) {
      return;
    }

    // Find all property access expressions in the file
    const propertyAccessExpressions = sourceFile.getDescendantsOfKind(
      ts.SyntaxKind.PropertyAccessExpression,
    );

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

    // Add imports for all the subcomponents we found
    if (subcomponentReferences.size > 0) {
      addOrUpdateImport(sourceFile, '@halfdomelabs/ui-components', [
        ...subcomponentReferences,
      ]);
    }

    return;
  },
});
