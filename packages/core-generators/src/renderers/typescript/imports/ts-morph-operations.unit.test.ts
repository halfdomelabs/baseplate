import type { SourceFile } from 'ts-morph';

import { CodeBlockWriter, Project } from 'ts-morph';
import { beforeEach, describe, expect, it } from 'vitest';

import type { TsImportDeclaration } from './types.js';

import {
  convertTsMorphImportDeclarationToTsImportDeclaration,
  getTsMorphImportDeclarationsFromSourceFile,
  replaceImportDeclarationsInSourceFile,
  writeGroupedImportDeclarationsWithCodeBlockWriter,
} from './ts-morph-operations.js';

describe('Import Utilities', () => {
  let project: Project;
  let sourceFile: SourceFile;

  beforeEach(() => {
    project = new Project();
    sourceFile = project.createSourceFile('temp.ts', '');
  });

  describe('getTsMorphImportDeclarationsFromSourceFile', () => {
    it('should return only non-side effect imports', () => {
      // Arrange
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'side-effect-module',
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'react',
        defaultImport: 'React',
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'lodash',
        namedImports: ['map', 'filter'],
      });

      // Act
      const result = getTsMorphImportDeclarationsFromSourceFile(sourceFile);

      // Assert
      expect(result.length).toBe(2);
      expect(result[0].getModuleSpecifier().getLiteralValue()).toBe('react');
    });

    it('should return an empty array when there are only side effect imports', () => {
      // Arrange
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'side-effect',
      });

      // Act
      const result = getTsMorphImportDeclarationsFromSourceFile(sourceFile);

      // Assert
      expect(result.length).toBe(0);
    });
  });

  describe('convertTsMorphImportDeclarationToTsImportDeclaration', () => {
    it('should convert a default import correctly', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'react',
        defaultImport: 'React',
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'react',
        isTypeOnly: false,
        defaultImport: 'React',
        namespaceImport: undefined,
        namedImports: [],
      });
    });

    it('should convert named imports correctly', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'lodash',
        namedImports: [{ name: 'map' }, { name: 'filter', alias: 'f' }],
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'lodash',
        isTypeOnly: false,
        defaultImport: undefined,
        namespaceImport: undefined,
        namedImports: [
          { name: 'map', alias: undefined, isTypeOnly: false },
          { name: 'filter', alias: 'f', isTypeOnly: false },
        ],
      });
    });

    it('should convert namespace imports correctly', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'styles',
        namespaceImport: 'styles',
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'styles',
        isTypeOnly: false,
        defaultImport: undefined,
        namespaceImport: 'styles',
        namedImports: [],
      });
    });

    it('should convert type-only imports correctly', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'types',
        isTypeOnly: true,
        namedImports: [{ name: 'User' }],
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'types',
        isTypeOnly: true,
        defaultImport: undefined,
        namespaceImport: undefined,
        namedImports: [{ name: 'User', alias: undefined, isTypeOnly: false }],
      });
    });

    it('should convert type-only named imports correctly', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'types',
        namedImports: [{ name: 'User', isTypeOnly: true }],
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'types',
        isTypeOnly: false,
        defaultImport: undefined,
        namespaceImport: undefined,
        namedImports: [{ name: 'User', alias: undefined, isTypeOnly: true }],
      });
    });

    it('should handle complex imports with multiple features', () => {
      // Arrange
      const declaration = sourceFile.addImportDeclaration({
        moduleSpecifier: 'module',
        defaultImport: 'DefaultExport',
        namedImports: [
          { name: 'namedExport' },
          { name: 'aliasedExport', alias: 'alias' },
          { name: 'TypeExport', isTypeOnly: true },
        ],
      });

      // Act
      const result =
        convertTsMorphImportDeclarationToTsImportDeclaration(declaration);

      // Assert
      expect(result).toEqual({
        moduleSpecifier: 'module',
        isTypeOnly: false,
        defaultImport: 'DefaultExport',
        namespaceImport: undefined,
        namedImports: [
          { name: 'namedExport', alias: undefined, isTypeOnly: false },
          { name: 'aliasedExport', alias: 'alias', isTypeOnly: false },
          { name: 'TypeExport', alias: undefined, isTypeOnly: true },
        ],
      });
    });
  });

  describe('writeGroupedImportDeclarationsWithCodeBlockWriter', () => {
    let writer: CodeBlockWriter;

    beforeEach(() => {
      writer = new CodeBlockWriter();
    });

    it('should write a simple default import', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe('import React from "react";\n\n');
    });

    it('should write named imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'lodash',
            namedImports: [{ name: 'map' }, { name: 'filter' }],
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe(
        'import { map, filter } from "lodash";\n\n',
      );
    });

    it('should write namespace imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'styles',
            namespaceImport: 'styles',
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe('import * as styles from "styles";\n\n');
    });

    it('should write type-only imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'types',
            isTypeOnly: true,
            namedImports: [{ name: 'User' }],
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe('import type { User } from "types";\n\n');
    });

    it('should write type-only named imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'types',
            namedImports: [
              { name: 'User', isTypeOnly: true },
              { name: 'Post' },
            ],
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe(
        'import { type User, Post } from "types";\n\n',
      );
    });

    it('should write aliased named imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'module',
            namedImports: [{ name: 'longName', alias: 'short' }],
          },
        ],
      ];

      // Execute
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Verify
      expect(writer.toString()).toBe(
        'import { longName as short } from "module";\n\n',
      );
    });

    it('should write mixed default and named imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'module',
            defaultImport: 'Default',
            namedImports: [{ name: 'named' }],
          },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe(
        'import Default, { named } from "module";\n\n',
      );
    });

    it('should write multiple import sections', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [{ moduleSpecifier: 'react', defaultImport: 'React' }],
        [
          { moduleSpecifier: 'lodash', namedImports: [{ name: 'map' }] },
          { moduleSpecifier: 'axios', defaultImport: 'axios' },
        ],
      ];

      // Act
      writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);

      // Assert
      expect(writer.toString()).toBe(
        'import React from "react";\n\n' +
          'import { map } from "lodash";\n' +
          'import axios from "axios";\n\n',
      );
    });

    it('should throw error when mixing namespace with default or named imports', () => {
      // Arrange
      const imports: TsImportDeclaration[][] = [
        [
          {
            moduleSpecifier: 'module',
            namespaceImport: 'NS',
            defaultImport: 'Default',
          },
        ],
      ];

      // Act & Assert
      expect(() => {
        writeGroupedImportDeclarationsWithCodeBlockWriter(writer, imports);
      }).toThrow(
        'Cannot have an import with both namespace and named/default imports!',
      );
    });
  });

  describe('replaceImportDeclarationsInSourceFile', () => {
    it('should replace imports', () => {
      // Arrange
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'react',
        defaultImport: 'React',
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'lodash',
        namedImports: ['map', 'filter'],
      });

      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
          {
            moduleSpecifier: 'lodash',
            namedImports: [{ name: 'map' }, { name: 'filter' }],
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        'import React from "react";\n' +
          'import { map, filter } from "lodash";\n\n',
      );
    });

    it('should preserve shebangs', () => {
      // Arrange
      sourceFile.replaceWithText(
        `#!/usr/bin/env node

import React from "react";

const x = A();`,
      );

      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        `#!/usr/bin/env node

import React from "react";

const x = A();`,
      );
    });

    it('should preserve shebangs with no imports', () => {
      // Arrange
      sourceFile.replaceWithText(
        `#!/usr/bin/env node

const x = A();`,
      );

      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        `#!/usr/bin/env node

import React from "react";


const x = A();`,
      );
    });

    it('should preserve client directives', () => {
      // Arrange
      sourceFile.replaceWithText(
        `'use client';

import type React from 'react';

import { Toaster as Sonner } from 'sonner';

import { buttonVariants } from '@src/styles/button.js';

const x = A();`,
      );

      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        "'use client';\n\n" + 'import React from "react";\n\n\nconst x = A();',
      );
    });

    it('should handle files with no initial imports', () => {
      // Arrange
      sourceFile.replaceWithText('const x = 1;');
      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'react',
            defaultImport: 'React',
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        'import React from "react";\n\n' + 'const x = 1;',
      );
    });

    it('should preserve leading comments', () => {
      // Arrange
      sourceFile.replaceWithText(
        `import { A } from "test";

// Comment on X
const x = 1;`,
      );

      const oldImportDeclarations = sourceFile.getImportDeclarations();
      const newImportDeclarations = [
        [
          {
            moduleSpecifier: 'test',
            namedImports: [{ name: 'A' }],
          },
        ],
      ];

      // Act
      replaceImportDeclarationsInSourceFile(
        sourceFile,
        oldImportDeclarations,
        newImportDeclarations,
      );

      // Assert
      expect(sourceFile.getFullText()).toBe(
        `import { A } from "test";

// Comment on X
const x = 1;`,
      );
    });
  });
});
