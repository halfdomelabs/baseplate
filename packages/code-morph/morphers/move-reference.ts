import { createTypescriptMorpher } from 'lib/types.js';
import { ts } from 'ts-morph';
import z from 'zod';

export default createTypescriptMorpher({
  name: 'move-import-reference',
  description:
    'Moves an import from one package/name to another package/name (can be the same package but different name)',
  optionSchema: z.object({
    fromImport: z.string().regex(/^[^:]+:[^:]+$/),
    toImport: z.string().regex(/^[^:]+:[^:]+$/),
  }),
  transform: (sourceFile, options) => {
    // find options
    const { fromImport, toImport } = options;

    const [fromImportPackage, fromImportName] = fromImport.split(':');
    const [toImportPackage, toImportName] = toImport.split(':');

    let hasImport = false;

    // remove the named import from the fromImportPackage
    const resolvedTargetImport =
      ts.resolveModuleName(
        fromImportPackage,
        sourceFile.getFilePath(),
        sourceFile.getProject().compilerOptions.get(),
        ts.sys,
      ).resolvedModule?.resolvedFileName ?? fromImportPackage;
    for (const importDeclaration of sourceFile.getImportDeclarations()) {
      const moduleSpecifier = importDeclaration.getModuleSpecifierValue();
      const resolvedModuleSpecifier =
        ts.resolveModuleName(
          moduleSpecifier,
          sourceFile.getFilePath(),
          sourceFile.getProject().compilerOptions.get(),
          ts.sys,
        ).resolvedModule?.resolvedFileName ?? moduleSpecifier;
      if (resolvedModuleSpecifier === resolvedTargetImport) {
        let hasOtherImports = false;
        for (const namedImport of importDeclaration.getNamedImports()) {
          if (namedImport.getName() === fromImportName) {
            namedImport.remove();
            hasImport = true;
          } else {
            hasOtherImports = true;
          }
        }
        if (!hasOtherImports) {
          importDeclaration.remove();
        }
      }
    }

    // add the named import to the toImportPackage
    if (hasImport) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: toImportPackage,
        namedImports: [toImportName],
      });

      sourceFile.organizeImports();
    }

    return sourceFile.getFullText();
  },
});
