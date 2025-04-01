import type { Node, SourceFile } from 'ts-morph';

import { SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '@src/types.js';

export default createTypescriptMorpher({
  name: 'build-task-refactor',
  description:
    'Converts buildTasks from using taskBuilder.addTask to returning an array of tasks',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  transform: (sourceFile: SourceFile) => {
    // Add createGeneratorTask import
    const syncImport = sourceFile
      .getImportDeclarations()
      .find(
        (dec) =>
          dec.getModuleSpecifierValue() === '@halfdomelabs/sync' &&
          !dec.isTypeOnly() &&
          dec
            .getNamedImports()
            .some((id) => id.getText() === 'createGenerator'),
      );

    if (!syncImport) return;

    syncImport.addNamedImport('createGeneratorTask');

    // Find buildTasks method
    const buildTasksMethod = sourceFile
      .getDescendantsOfKind(SyntaxKind.MethodDeclaration)
      .find((method) => method.getName() === 'buildTasks');

    if (!buildTasksMethod) return;

    const body = buildTasksMethod.getBody();
    if (!body) return;

    // Get all statements in the method body
    const statements = body.getChildren()[1].getChildren();

    // Check if all statements are addTask calls
    const nonAddTaskStatements = statements.filter((statement) => {
      if (!statement.isKind(SyntaxKind.ExpressionStatement)) return true;
      const expression = statement.getExpression();
      if (!expression.isKind(SyntaxKind.CallExpression)) return true;
      const text = expression.getText();
      return !text.startsWith('taskBuilder.addTask');
    });

    if (nonAddTaskStatements.length > 0) {
      throw new Error(
        `buildTasks contains non-addTask statements: ${nonAddTaskStatements
          .map((s) => s.getText())
          .join('\n')}`,
      );
    }

    // Extract all addTask configurations
    const tasks = statements
      .map((statement) => {
        const callExp = statement
          .asKind(SyntaxKind.ExpressionStatement)
          ?.getExpression()
          .asKind(SyntaxKind.CallExpression);

        if (!callExp) return null;

        const config = callExp.getArguments()[0] as Node | undefined;
        if (!config) return null;

        return config.getText();
      })
      .filter(Boolean);

    // Update the method signature and body
    const parameters = buildTasksMethod.getParameters();
    const descriptorParam = parameters.find(
      (p) => p.getName() === 'descriptor',
    );
    const descriptorText = descriptorParam ? 'descriptor' : '';

    // Convert method to property with arrow function
    buildTasksMethod.replaceWithText(
      `buildTasks: (${descriptorText}) => [\n${tasks
        .map((task) => `    createGeneratorTask(${task}),`)
        .join('\n')}\n  ]`,
    );
  },
});
