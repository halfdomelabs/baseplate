import { enhanceErrorWithContext } from '@baseplate-dev/utils';
import { Project } from 'ts-morph';

export interface TsFileExportInfo {
  name: string;
  isDefault?: boolean;
  isTypeOnly?: boolean;
}

/**
 * Extracts all available exports from a TypeScript file
 */
export function inferExportsFromTsFile(
  filePath: string,
): Map<string, TsFileExportInfo> {
  try {
    const project = new Project();
    const sourceFile = project.addSourceFileAtPath(filePath);
    const availableExports = new Map<string, TsFileExportInfo>();

    // Find export declarations
    for (const exportDecl of sourceFile.getExportDeclarations()) {
      for (const namedExport of exportDecl.getNamedExports()) {
        availableExports.set(namedExport.getName(), {
          name: namedExport.getName(),
          isTypeOnly: namedExport.isTypeOnly(),
        });
      }
    }

    // Find variable declarations that are exported
    for (const varDecl of sourceFile.getVariableDeclarations()) {
      if (varDecl.isExported()) {
        availableExports.set(varDecl.getName(), {
          name: varDecl.getName(),
          isTypeOnly: false,
        });
      }
    }

    // Find function declarations that are exported
    for (const func of sourceFile.getFunctions()) {
      if (func.isExported()) {
        const name = func.getName();
        if (name) {
          availableExports.set(name, {
            name,
            isTypeOnly: false,
          });
        }
      }
    }

    // Find class declarations that are exported
    for (const cls of sourceFile.getClasses()) {
      if (cls.isExported()) {
        const name = cls.getName();
        if (name) {
          availableExports.set(name, {
            name,
            isTypeOnly: false,
          });
        }
      }
    }

    // Find interface declarations that are exported
    for (const iface of sourceFile.getInterfaces()) {
      if (iface.isExported()) {
        availableExports.set(iface.getName(), {
          name: iface.getName(),
          isTypeOnly: true,
        });
      }
    }

    // Find type declarations that are exported
    for (const typeAlias of sourceFile.getTypeAliases()) {
      if (typeAlias.isExported()) {
        availableExports.set(typeAlias.getName(), {
          name: typeAlias.getName(),
          isTypeOnly: true,
        });
      }
    }

    // Check for default export
    const defaultExportSymbol = sourceFile.getDefaultExportSymbol();
    if (defaultExportSymbol) {
      const name = defaultExportSymbol.getName();
      availableExports.set(name, {
        name,
        isDefault: true,
        isTypeOnly: false,
      });
    }

    return availableExports;
  } catch (error) {
    throw enhanceErrorWithContext(
      error,
      `Failed to extract exports from ${filePath}`,
    );
  }
}
