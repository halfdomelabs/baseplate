import type { SourceFile } from 'ts-morph';

import { SyntaxKind } from 'ts-morph';

import { createTypescriptMorpher } from '@src/types.js';

export default createTypescriptMorpher({
  name: 'deprecate-create-task-builder',
  description:
    'Migrates away from createTaskConfigBuilder to direct taskBuilder.addTask usage',
  options: {},
  pathGlobs: ['src/generators/**/*.ts'],
  transform: (sourceFile: SourceFile) => {
    const importDeclarations = sourceFile.getImportDeclarations();

    // Find and remove createTaskConfigBuilder from imports
    const syncImport = importDeclarations.find(
      (dec) =>
        dec.getModuleSpecifierValue() === '@halfdomelabs/sync' &&
        !dec.isTypeOnly(),
    );

    if (!syncImport) return;

    const createTaskConfigBuilderImport = syncImport
      .getNamedImports()
      .find((id) => id.getText() === 'createTaskConfigBuilder');

    if (!createTaskConfigBuilderImport) return;

    // Remove the named import
    createTaskConfigBuilderImport.remove();

    // Find createTaskConfigBuilder variable declarations
    const taskBuilderVars = sourceFile
      .getDescendantsOfKind(SyntaxKind.VariableStatement)
      .filter((statement) => {
        const declarations = statement.getDeclarations();
        return declarations.some((dec) =>
          dec.getInitializer()?.getText().startsWith('createTaskConfigBuilder'),
        );
      });

    // Find taskBuilder.addTask calls that use the created config
    const addTaskCalls = sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .filter((call) => {
        const text = call.getText();
        return taskBuilderVars.some((v) => {
          const varName = v.getDeclarations()[0].getName();
          return text.startsWith(`${varName}(`);
        });
      });

    // For each taskBuilder.addTask call, replace it with the inner configuration
    for (const call of addTaskCalls) {
      const configVar = taskBuilderVars.find((v) => {
        const varName = v.getDeclarations()[0].getName();
        return call.getText().startsWith(`${varName}(`);
      });

      if (!configVar) continue;

      const configFunction = configVar
        .getDeclarations()[0]
        .getInitializer()
        ?.asKind(SyntaxKind.CallExpression)
        ?.getArguments()[0]
        ?.asKind(SyntaxKind.ArrowFunction);

      if (!configFunction) continue;

      const returnStatement = configFunction
        .getBody()
        .asKind(SyntaxKind.ParenthesizedExpression)
        ?.getExpression();

      if (!returnStatement) continue;

      // Check if descriptor is used in the function body
      const isDescriptorUsed = configFunction
        .getBody()
        .getText()
        .includes('descriptor');

      // If descriptor is not used, remove it from the parent buildTasks method
      if (!isDescriptorUsed) {
        const buildTasksMethod = sourceFile
          .getDescendantsOfKind(SyntaxKind.MethodDeclaration)
          .find((method) => method.getName() === 'buildTasks');

        if (buildTasksMethod) {
          const parameters = buildTasksMethod.getParameters();
          if (
            parameters.length === 2 &&
            parameters[1].getName() === 'descriptor'
          ) {
            parameters[1].remove();
          }
        }
      }

      call.replaceWithText(returnStatement.getText());
    }

    // Remove the createTaskConfigBuilder variable declarations
    for (const v of taskBuilderVars) v.remove();

    // Clean up empty imports
    if (syncImport.getNamedImports().length === 0) {
      syncImport.remove();
    }
  },
});
