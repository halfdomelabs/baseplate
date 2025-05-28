import z from 'zod';

import { createTypescriptMorpher } from '@src/types.js';

export default createTypescriptMorpher({
  name: 'rename-path-alias',
  description:
    'Renames path aliases from @src/ to #src/ in imports and exports',
  options: {
    fromAlias: {
      description: 'The path alias to rename from (e.g. @src)',
      optional: false,
      validation: z.string(),
    },
    toAlias: {
      description: 'The path alias to rename to (e.g. #src)',
      optional: false,
      validation: z.string(),
    },
  },
  transform: (sourceFile, options) => {
    const { fromAlias, toAlias } = options;

    // Handle imports
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      if (moduleSpecifier.startsWith(`${fromAlias}/`)) {
        importDeclaration.setModuleSpecifier(
          moduleSpecifier.replace(`${fromAlias}/`, `${toAlias}/`),
        );
      }
    }

    // Handle exports
    for (const exportDeclaration of sourceFile.getExportDeclarations()) {
      const moduleSpecifier = exportDeclaration.getModuleSpecifierValue();
      if (moduleSpecifier?.startsWith(`${fromAlias}/`)) {
        exportDeclaration.setModuleSpecifier(
          moduleSpecifier.replace(`${fromAlias}/`, `${toAlias}/`),
        );
      }
    }

    return sourceFile.getFullText();
  },
});
