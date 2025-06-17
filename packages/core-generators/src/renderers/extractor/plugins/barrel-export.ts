import { parseGeneratorName } from '@baseplate-dev/sync';
import {
  createTemplateExtractorPlugin,
  TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY,
} from '@baseplate-dev/sync/extractor-v2';
import { handleFileNotFoundError } from '@baseplate-dev/utils/node';
import fs from 'node:fs/promises';
import path from 'node:path';
import { Project, QuoteKind, VariableDeclarationKind } from 'ts-morph';

import { getGeneratedTemplateConstantName } from '../utils/generated-template-file-names.js';

export interface TemplateExtractorBarrelExport {
  moduleSpecifier: string;
  namedExports: string[];
  isTypeOnly?: boolean;
}

export interface TemplateExtractorGeneratedBarrelExport {
  moduleSpecifier: string; // relative to generated folder
  namedExport: string; // the import name
  name: string; // the property name in the export object
}

export function mergeBarrelExports(
  indexFileContents: string | undefined,
  barrelExports: TemplateExtractorBarrelExport[],
): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const sourceFile = project.createSourceFile(
    'index.ts',
    indexFileContents ?? '',
  );

  // Collect existing exports to merge with new ones
  const existingExports: TemplateExtractorBarrelExport[] = [];

  for (const exportDecl of sourceFile.getExportDeclarations()) {
    const moduleSpecifier = exportDecl.getModuleSpecifierValue();
    const isTypeOnly = exportDecl.isTypeOnly();

    if (!moduleSpecifier) continue;

    if (
      moduleSpecifier.startsWith(`./${TEMPLATE_EXTRACTOR_GENERATED_DIRECTORY}`)
    ) {
      continue;
    }

    // Handle star exports
    if (exportDecl.getNamedExports().length === 0) {
      existingExports.push({
        moduleSpecifier,
        namedExports: ['*'],
        isTypeOnly,
      });
    } else {
      // Handle named exports
      const namedExports = exportDecl
        .getNamedExports()
        .map((ne) => ne.getName());
      if (namedExports.length > 0) {
        existingExports.push({
          moduleSpecifier,
          namedExports,
          isTypeOnly,
        });
      }
    }
  }

  // Merge existing exports with new ones
  const allExports = [...existingExports, ...barrelExports];

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

  for (const barrelExport of allExports) {
    const key = barrelExport.moduleSpecifier;
    if (!exportsByModuleAndType.has(key)) {
      exportsByModuleAndType.set(key, {
        namedExports: new Map(),
      });
    }

    const moduleData = exportsByModuleAndType.get(key);
    if (!moduleData) {
      throw new Error(`Module data not found for key: ${key}`);
    }
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

  // Sort module specifiers
  const sortedModuleSpecifiers = [...exportsByModuleAndType.keys()].sort();

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

export function mergeGeneratedBarrelExports(
  generatorName: string,
  indexFileContents: string | undefined,
  generatedBarrelExports: TemplateExtractorGeneratedBarrelExport[],
): string {
  const project = new Project({
    useInMemoryFileSystem: true,
    manipulationSettings: {
      quoteKind: QuoteKind.Single,
    },
  });
  const sourceFile = project.createSourceFile(
    'index.ts',
    indexFileContents ?? '',
  );

  // Remove all existing import and export statements
  for (const decl of sourceFile.getImportDeclarations()) decl.remove();
  for (const decl of sourceFile.getExportDeclarations()) decl.remove();
  for (const decl of sourceFile.getVariableStatements()) decl.remove();

  if (generatedBarrelExports.length === 0) {
    return sourceFile.getFullText();
  }

  // Group exports by module specifier
  const importsByModuleSpecifier = new Map<string, Set<string>>();

  for (const barrelExport of generatedBarrelExports) {
    let imports = importsByModuleSpecifier.get(barrelExport.moduleSpecifier);
    if (!imports) {
      imports = new Set();
      importsByModuleSpecifier.set(barrelExport.moduleSpecifier, imports);
    }
    imports.add(barrelExport.namedExport);
  }

  // Add import statements (sorted by module specifier)
  const sortedModuleSpecifiers = [...importsByModuleSpecifier.keys()].sort();
  for (const moduleSpecifier of sortedModuleSpecifiers) {
    const imports = importsByModuleSpecifier.get(moduleSpecifier);
    if (!imports) continue;
    const namedImports = [...imports].sort();
    sourceFile.addImportDeclaration({
      moduleSpecifier,
      namedImports,
    });
  }

  // Create the export constant
  const constantName = getGeneratedTemplateConstantName(
    generatorName,
    'GENERATED',
  );

  // Group exports by their property names
  const exportProperties = new Map<string, string>();
  for (const barrelExport of generatedBarrelExports) {
    exportProperties.set(barrelExport.name, barrelExport.namedExport);
  }

  // Sort properties by name for consistent output
  const sortedPropertyNames = [...exportProperties.keys()].sort();
  const properties = sortedPropertyNames.map(
    (propName) => `${propName}: ${exportProperties.get(propName)}`,
  );

  sourceFile.addVariableStatement({
    isExported: true,
    declarationKind: VariableDeclarationKind.Const,
    declarations: [
      {
        name: constantName,
        initializer: `{\n  ${properties.join(',\n  ')},\n}`,
      },
    ],
  });

  return sourceFile.getFullText();
}

export const templateExtractorBarrelExportPlugin =
  createTemplateExtractorPlugin({
    name: 'barrel-export',
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

      const generatedBarrelExportMap = new Map<
        string,
        TemplateExtractorGeneratedBarrelExport[]
      >();

      function addBarrelExport(
        generatorName: string,
        barrelExport: TemplateExtractorBarrelExport,
      ): void {
        const barrelExports = barrelExportMap.get(generatorName) ?? [];
        barrelExports.push(barrelExport);
        barrelExportMap.set(generatorName, barrelExports);
      }

      function addGeneratedBarrelExport(
        generatorName: string,
        generatedBarrelExport: TemplateExtractorGeneratedBarrelExport,
      ): void {
        const generatedBarrelExports =
          generatedBarrelExportMap.get(generatorName) ?? [];
        generatedBarrelExports.push(generatedBarrelExport);
        generatedBarrelExportMap.set(generatorName, generatedBarrelExports);
      }

      // Merge the barrel exports into the barrel file
      api.registerHook('afterWrite', async () => {
        // Process regular barrel exports
        for (const [generatorName, barrelExports] of barrelExportMap) {
          const parsedGeneratorName = parseGeneratorName(generatorName);
          const extractorConfig =
            context.configLookup.getExtractorConfig(generatorName);
          if (!extractorConfig) {
            throw new Error(`Extractor config not found: ${generatorName}`);
          }
          const indexFileContents = await fs
            .readFile(
              path.join(extractorConfig.generatorDirectory, 'index.ts'),
              'utf8',
            )
            .catch(handleFileNotFoundError);
          const updatedContents = mergeBarrelExports(indexFileContents, [
            ...barrelExports,
            // always export the generator file
            {
              moduleSpecifier: `./${parsedGeneratorName.generatorBasename}.generator.js`,
              namedExports: ['*'],
            },
          ]);
          await fileContainer.writeFile(
            path.join(extractorConfig.generatorDirectory, 'index.ts'),
            updatedContents,
          );
        }

        // Process generated barrel exports
        for (const [
          generatorName,
          generatedBarrelExports,
        ] of generatedBarrelExportMap) {
          const extractorConfig =
            context.configLookup.getExtractorConfig(generatorName);
          if (!extractorConfig) {
            throw new Error(`Extractor config not found: ${generatorName}`);
          }
          if (generatedBarrelExports.length === 0) {
            continue;
          }

          // Ensure generated directory exists
          const generatedDir = path.join(
            extractorConfig.generatorDirectory,
            'generated',
          );
          const generatedIndexPath = path.join(generatedDir, 'index.ts');

          const generatedIndexFileContents = await fs
            .readFile(generatedIndexPath, 'utf8')
            .catch(handleFileNotFoundError);

          const updatedGeneratedContents = mergeGeneratedBarrelExports(
            generatorName,
            generatedIndexFileContents,
            generatedBarrelExports,
          );

          await fileContainer.writeFile(
            generatedIndexPath,
            updatedGeneratedContents,
          );
        }
      });

      return {
        addBarrelExport,
        addGeneratedBarrelExport,
      };
    },
  });
