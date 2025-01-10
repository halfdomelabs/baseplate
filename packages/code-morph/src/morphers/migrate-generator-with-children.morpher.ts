import type { ParameterDeclaration, SourceFile } from 'ts-morph';

import { Node, SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '@src/types.js';

/**
 * Migrates createGeneratorWithChildren to createGeneratorWithTasks for generators
 */
export default createTypescriptMorpher({
  name: 'migrate-generator-with-children',
  description:
    'Migrates createGeneratorWithChildren to createGeneratorWithTasks',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  transform: (sourceFile: SourceFile) => {
    const importDeclarations = sourceFile.getImportDeclarations();

    // look for createGeneratorWithChildren import
    const createGeneratorWithChildrenImport = importDeclarations
      .find(
        (dec) =>
          dec.getModuleSpecifierValue() === '@halfdomelabs/sync' &&
          !dec.isTypeOnly(),
      )
      ?.getNamedImports()
      .find((id) => id.getText() === 'createGeneratorWithChildren');

    if (!createGeneratorWithChildrenImport) return;

    createGeneratorWithChildrenImport.renameAlias('createGeneratorWithTasks');
    createGeneratorWithChildrenImport.replaceWithText(
      'createGeneratorWithTasks',
    );

    // Find createGeneratorWithTasks call
    const callExpressions = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const expression = call.getExpression();
        return (
          Node.isIdentifier(expression) &&
          expression.getText() === 'createGeneratorWithTasks'
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

    // Store properties to migrate
    const argsToMigrate: Node[] = [];
    let createGeneratorMethod: Node | undefined;

    // Filter and collect properties
    const properties = firstArg.getProperties();
    const propsToRemove = properties.filter((prop) => {
      if (Node.isPropertyAssignment(prop)) {
        const name = prop.getName();
        if (name === 'dependencies' || name === 'exports') {
          argsToMigrate.push(prop);
          return true;
        }
      }
      if (
        Node.isMethodDeclaration(prop) &&
        prop.getName() === 'createGenerator'
      ) {
        createGeneratorMethod = prop;
        return true;
      }
      return false;
    });

    if (
      !createGeneratorMethod ||
      !Node.isMethodDeclaration(createGeneratorMethod)
    ) {
      throw new Error('createGenerator method not found');
    }

    const parameters: (ParameterDeclaration | undefined)[] =
      createGeneratorMethod.getParameters();
    const dependencyParam = parameters[1];

    // Create the main task declaration
    const createMainTaskDeclaration = `
taskBuilder.addTask({
    name: 'main',
    ${argsToMigrate.map((arg) => arg.getText()).join(',\n    ')},
    run(${dependencyParam ? dependencyParam.getText() : ''})
        ${createGeneratorMethod.getBody()?.getText() ?? ''}
})`;

    // Add buildTasks method
    firstArg.addMethod({
      name: 'buildTasks',
      parameters: [
        { name: 'taskBuilder' },
        ...(parameters[0] ? [parameters[0]?.getStructure()] : []),
      ],
      statements: [createMainTaskDeclaration],
    });

    // Remove unnecessary props
    for (const prop of propsToRemove) {
      prop.remove();
    }
  },
});
