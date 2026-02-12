import type { SourceFile } from 'ts-morph';

import { kebabCase } from 'change-case';
import path from 'node:path';
import { Node, SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '#src/types.js';

/**
 * Migrates createGeneratorWithTasks to createGenerator for generators
 */
export default createTypescriptMorpher({
  name: 'migrate-generator-with-tasks',
  description: 'Migrates createGeneratorWithTasks to createGenerator',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  transform: (sourceFile: SourceFile) => {
    const importDeclarations = sourceFile.getImportDeclarations();

    // look for createGeneratorWithTasks import
    const createGeneratorWithTasksImport = importDeclarations
      .find(
        (dec) =>
          dec.getModuleSpecifierValue() === '@baseplate-dev/sync' &&
          !dec.isTypeOnly(),
      )
      ?.getNamedImports()
      .find((id) => id.getText() === 'createGeneratorWithTasks');

    if (!createGeneratorWithTasksImport) return;

    createGeneratorWithTasksImport.renameAlias('createGenerator');
    createGeneratorWithTasksImport.replaceWithText('createGenerator');

    // Find createGenerator call
    const callExpressions = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const expression = call.getExpression();
        return (
          Node.isIdentifier(expression) &&
          expression.getText() === 'createGenerator'
        );
      });

    if (callExpressions.length === 0) return;
    if (callExpressions.length > 1) {
      throw new Error('Only one call expression allowed');
    }

    const callExpression = callExpressions[0];
    const [firstArg] = callExpression.getArguments();

    if (!Node.isObjectLiteralExpression(firstArg)) {
      throw new Error('First argument must be an object literal');
    }

    // Get the generator name from the variable declaration
    const variableDeclaration = callExpression.getFirstAncestorByKind(
      SyntaxKind.VariableDeclaration,
    );

    if (!variableDeclaration) {
      throw new Error('Generator must be assigned to a variable');
    }

    const generatorName = variableDeclaration.getName();
    const camelCaseFirstChar = generatorName.charAt(0).toLowerCase();
    const newGeneratorName = camelCaseFirstChar + generatorName.slice(1);

    // Get the generator path from the last 2 directories
    const filePath = sourceFile.getFilePath();
    const parts = filePath.split(path.sep);
    if (parts.length < 3) {
      throw new Error('Generator must be in at least 2 directories deep');
    }
    const generatorPath = `${parts.at(-3)}/${parts.at(-2)}`;

    // Test the generator name matches the last part of the generator path
    const expectedGeneratorName = kebabCase(generatorName).replace(
      '-generator',
      '',
    );
    if (expectedGeneratorName !== parts.at(-2)) {
      throw new Error(
        `Generator name must match the kebab case of the last part of the path: ${expectedGeneratorName} !== ${parts.at(-2)}`,
      );
    }

    // Add name and generatorFileUrl properties
    firstArg.insertPropertyAssignments(0, [
      {
        name: 'name',
        initializer: `'${generatorPath}'`,
      },
      {
        name: 'generatorFileUrl',
        initializer: 'import.meta.url',
      },
    ]);

    // If there is a getDefaultChildGenerators function that only returns an empty object, remove it
    const getDefaultChildGenerators = firstArg.getProperty(
      'getDefaultChildGenerators',
    );

    if (
      getDefaultChildGenerators?.getText() ===
      'getDefaultChildGenerators: () => ({})'
    ) {
      getDefaultChildGenerators.remove();
    }

    // Replace the variable declaration
    const variableStatement = variableDeclaration.getFirstAncestorByKind(
      SyntaxKind.VariableStatement,
    );

    if (!variableStatement) {
      throw new Error('Generator must be declared in a variable statement');
    }

    variableStatement.replaceWithText(
      `export const ${newGeneratorName} = ${callExpression.getText()}`,
    );

    // Remove the default export
    const exportDeclaration = sourceFile
      .getDescendantsOfKind(SyntaxKind.ExportAssignment)
      .find(
        (exp) =>
          Node.isIdentifier(exp.getExpression()) &&
          exp.getExpression().getText() === generatorName,
      );

    if (exportDeclaration) {
      exportDeclaration.remove();
    }
  },
});
