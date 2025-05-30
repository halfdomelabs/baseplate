import type { SourceFile } from 'ts-morph';

import path from 'node:path';
import { SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '#src/types.js';

import { moveFile } from './utils/move-file.js';

export default createTypescriptMorpher({
  name: 'generator-name-fixer',
  description:
    'Ensures generator names match their folder names and renames files to <name>.generator.ts',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  saveUsingTsMorph: true,
  transform: (sourceFile: SourceFile, options, context) => {
    // Skip if not a generator file
    if (!sourceFile.getFilePath().includes('/generators/')) {
      return;
    }

    // Get the folder name and parent directory from the path
    const filePath = sourceFile.getFilePath();
    const dirPath = path.dirname(filePath);
    const folderName = path.basename(dirPath);
    const parentDir = path.basename(path.dirname(dirPath));

    // Find the createGenerator call
    const createGeneratorCall = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .find((call) => {
        const expression = call.getExpression();
        return expression.getText() === 'createGenerator';
      });

    if (!createGeneratorCall) {
      return;
    }

    // Get the first argument which should be an object
    const firstArg = createGeneratorCall.getArguments()[0];
    if (!firstArg.isKind(SyntaxKind.ObjectLiteralExpression)) {
      return;
    }

    // Find the name property
    const nameProperty = firstArg.getProperties().find((prop) => {
      if (!prop.isKind(SyntaxKind.PropertyAssignment)) {
        return false;
      }
      return prop.getNameNode().getText() === 'name';
    });

    if (!nameProperty?.isKind(SyntaxKind.PropertyAssignment)) {
      return;
    }

    const nameInitializer = nameProperty.getInitializer();
    if (!nameInitializer) {
      return;
    }

    // Extract the current name from the string literal
    const currentName = nameInitializer.getText().replaceAll(/['"]/g, '');
    const expectedName = `${parentDir}/${folderName}`;

    // If names don't match, throw an error
    if (currentName !== expectedName) {
      throw new Error(
        `Generator name mismatch: ${currentName} !== ${expectedName}`,
      );
    }

    // Rename the file if needed
    const currentFileName = path.basename(filePath);
    const expectedFileName = `${folderName}.generator.ts`;

    if (currentFileName !== expectedFileName) {
      moveFile(sourceFile, path.join(dirPath, expectedFileName), context);
    }
  },
});
