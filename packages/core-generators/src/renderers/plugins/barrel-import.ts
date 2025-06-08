import { createTemplateExtractorPlugin } from '@baseplate-dev/sync/extractor-v2';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Project, QuoteKind } from 'ts-morph';

interface BarrelExport {
  moduleSpecifier: string;
  namedExports: string[];
  isTypeOnly?: boolean;
}

export function mergeBarrelExports(
  indexFileContents: string,
  barrelExports: BarrelExport[],
): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const sourceFile = project.createSourceFile('index.ts', indexFileContents);

  // Remove all existing export statements
  for (const decl of sourceFile.getExportDeclarations()) {
    decl.remove();
  }

  // Group exports by module specifier and type
  const exportsByModuleAndType = new Map<
    string,
    {
      starExport?: { isTypeOnly: boolean };
      namedExports: Map<string, boolean>; // name -> isTypeOnly
    }
  >();

  for (const barrelExport of barrelExports) {
    const key = barrelExport.moduleSpecifier;
    if (!exportsByModuleAndType.has(key)) {
      exportsByModuleAndType.set(key, {
        namedExports: new Map(),
      });
    }

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const moduleData = exportsByModuleAndType.get(key)!;
    const isTypeOnly = barrelExport.isTypeOnly ?? false;

    for (const namedExport of barrelExport.namedExports) {
      if (namedExport === '*') {
        // Star export takes precedence
        moduleData.starExport = { isTypeOnly };
      } else {
        moduleData.namedExports.set(namedExport, isTypeOnly);
      }
    }
  }

  // Sort module specifiers, putting * exports first
  const sortedModuleSpecifiers = [...exportsByModuleAndType.keys()].sort(
    (a, b) => {
      const aHasStar = exportsByModuleAndType.get(a)?.starExport !== undefined;
      const bHasStar = exportsByModuleAndType.get(b)?.starExport !== undefined;

      // If one has star export and the other doesn't, prioritize the one with star
      if (aHasStar && !bHasStar) return -1;
      if (!aHasStar && bHasStar) return 1;

      // Otherwise, sort alphabetically
      return a.localeCompare(b);
    },
  );

  // Add exports back in sorted order
  for (const moduleSpecifier of sortedModuleSpecifiers) {
    const moduleData = exportsByModuleAndType.get(moduleSpecifier);
    if (!moduleData) continue;

    // Add star export first if it exists
    if (moduleData.starExport) {
      sourceFile.addExportDeclaration({
        moduleSpecifier,
        isTypeOnly: moduleData.starExport.isTypeOnly,
      });
    } else if (moduleData.namedExports.size > 0) {
      // Group named exports by isTypeOnly
      const typeOnlyExports: string[] = [];
      const regularExports: string[] = [];

      for (const [name, isTypeOnly] of moduleData.namedExports) {
        if (isTypeOnly) {
          typeOnlyExports.push(name);
        } else {
          regularExports.push(name);
        }
      }

      // Add type-only exports
      if (typeOnlyExports.length > 0) {
        sourceFile.addExportDeclaration({
          moduleSpecifier,
          isTypeOnly: true,
          namedExports: typeOnlyExports.sort().map((name) => ({ name })),
        });
      }

      // Add regular exports
      if (regularExports.length > 0) {
        sourceFile.addExportDeclaration({
          moduleSpecifier,
          isTypeOnly: false,
          namedExports: regularExports.sort().map((name) => ({ name })),
        });
      }
    }
  }

  return sourceFile.getFullText();
}

export const templateExtractorBarrelImportPlugin =
  createTemplateExtractorPlugin({
    name: 'barrel-import',
    getInstance: ({ context, api }) => {
      const { fileContainer } = context;
      const barrelExportMap = new Map<
        string,
        {
          moduleSpecifier: string;
          namedExports: string[];
          isTypeOnly?: boolean;
        }[]
      >();

      function addBarrelExport(
        generatorName: string,
        moduleSpecifier: string,
        namedExports: string[],
        isTypeOnly?: boolean,
      ): void {
        const barrelExports = barrelExportMap.get(generatorName) ?? [];
        barrelExports.push({
          moduleSpecifier,
          namedExports,
          isTypeOnly,
        });
        barrelExportMap.set(generatorName, barrelExports);
      }

      // Merge the barrel exports into the barrel file
      api.registerHook('afterWrite', async () => {
        for (const [generatorName, barrelExports] of barrelExportMap) {
          const extractorConfig =
            context.configLookup.getExtractorConfig(generatorName);
          if (!extractorConfig) {
            throw new Error(`Extractor config not found: ${generatorName}`);
          }
          const indexFileContents = await fs.readFile(
            path.join(extractorConfig.generatorDirectory, 'index.ts'),
            'utf8',
          );
          const updatedContents = mergeBarrelExports(
            indexFileContents,
            barrelExports,
          );
          fileContainer.writeFile(
            path.join(extractorConfig.generatorDirectory, 'index.ts'),
            updatedContents,
          );
        }
      });

      return {
        addBarrelExport,
      };
    },
  });
