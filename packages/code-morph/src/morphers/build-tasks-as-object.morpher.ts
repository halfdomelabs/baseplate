import type {
  ArrowFunction,
  MethodDeclaration,
  Node,
  PropertyAssignment,
  SourceFile,
} from 'ts-morph';

import { camelCase } from 'change-case';
import { SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '#src/types.js';

export default createTypescriptMorpher({
  name: 'build-tasks-as-object',
  description:
    'Converts buildTasks from returning an array to returning an object with named tasks',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  transform: (sourceFile: SourceFile) => {
    // Find buildTasks property or method
    const buildTasksNodes = [
      ...sourceFile.getDescendantsOfKind(SyntaxKind.PropertyAssignment),
      ...sourceFile.getDescendantsOfKind(SyntaxKind.MethodDeclaration),
    ].filter(
      (node): node is PropertyAssignment | MethodDeclaration =>
        node.getName() === 'buildTasks',
    );

    if (buildTasksNodes.length === 0) {
      return;
    }

    for (const buildTasksNode of buildTasksNodes) {
      // Get the arrow function or method body
      let arrowFunction: ArrowFunction | Node | undefined;

      if (buildTasksNode.isKind(SyntaxKind.PropertyAssignment)) {
        const initializer = buildTasksNode.getInitializer();
        if (initializer?.isKind(SyntaxKind.ArrowFunction)) {
          arrowFunction = initializer;
        }
      } else if (buildTasksNode.isKind(SyntaxKind.MethodDeclaration)) {
        const body = buildTasksNode.getBody();
        if (body) {
          const child = body.getChildren().at(1);
          if (child) {
            arrowFunction = child;
          }
        }
      }

      if (!arrowFunction) continue;

      // Get the array literal expression
      const arrayLiteral = arrowFunction
        .getChildrenOfKind(SyntaxKind.ArrayLiteralExpression)
        .at(0);

      if (!arrayLiteral) continue;

      // Convert array elements to object properties
      const objectProperties: string[] = [];

      for (const element of arrayLiteral.getElements()) {
        if (!element.isKind(SyntaxKind.CallExpression)) {
          throw new Error('Found non-call expression in buildTasks array');
        }

        const callExpression = element;
        const callee = callExpression.getExpression().getText();
        const args = callExpression.getArguments().at(0);

        if (!args) continue;

        switch (callee) {
          case 'createGeneratorTask': {
            // Extract name from object argument and use it as key
            const objLiteral = args.asKind(SyntaxKind.ObjectLiteralExpression);
            if (!objLiteral) {
              throw new Error(
                'createGeneratorTask must have an object argument',
              );
            }

            const nameProperty = objLiteral.getProperty('name');
            if (!nameProperty?.isKind(SyntaxKind.PropertyAssignment)) {
              throw new Error('createGeneratorTask must have a name property');
            }

            const nameInitializer = nameProperty.getInitializer();
            if (!nameInitializer) {
              throw new Error('createGeneratorTask must have a name property');
            }

            const name = nameInitializer.getText().replaceAll(/['"]/g, '');
            if (!name) {
              throw new Error('createGeneratorTask must have a name property');
            }

            // Remove name property and keep rest of object
            const properties = objLiteral
              .getProperties()
              .filter(
                (prop) =>
                  !prop.isKind(SyntaxKind.PropertyAssignment) ||
                  prop.getName() !== 'name',
              )
              .map((prop) => prop.getText());

            objectProperties.push(
              `${camelCase(name)}: createGeneratorTask({${properties.join(',')}})`,
            );

            break;
          }
          case 'createNodePackagesTask': {
            objectProperties.push(`nodePackages: ${element.getText()}`);

            break;
          }
          case 'createNodeTask': {
            objectProperties.push(`node: ${element.getText()}`);

            break;
          }
          default: {
            throw new Error(
              `Unexpected task creator function: ${callee}. Only createGeneratorTask, createNodePackagesTask, and createNodeTask are supported.`,
            );
          }
        }
      }

      // Replace array with object
      let descriptorText = '';
      if (buildTasksNode.isKind(SyntaxKind.MethodDeclaration)) {
        const params = buildTasksNode.getParameters();
        if (params.length > 0) {
          descriptorText = params[0].getText();
        }
      } else if (arrowFunction.isKind(SyntaxKind.ArrowFunction)) {
        const params = arrowFunction.getParameters();
        if (params.length > 0) {
          descriptorText = params[0].getText();
        }
      }

      const newText = `buildTasks: (${descriptorText}) => ({
    ${objectProperties.join(',\n    ')}
  })`;

      buildTasksNode.replaceWithText(newText);
    }
  },
});
