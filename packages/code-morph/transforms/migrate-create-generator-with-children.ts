import * as js from 'jscodeshift';
import invariant from 'tiny-invariant';

function getMaybeIdentifierName(
  maybeIdentifier: js.ASTNode,
): string | undefined {
  if (maybeIdentifier.type === 'Identifier') {
    return maybeIdentifier.name;
  }

  return undefined;
}

/**
 * Migrates createGeneratorWithChildren to createGeneratorWithTasks for generators
 */
const transform: js.Transform = (file, api) => {
  const j = api.jscodeshift;
  const root = j(file.source);

  const callExpressions = root.find(
    j.CallExpression,
    (n) =>
      n.callee.type === 'Identifier' &&
      n.callee.name === 'createGeneratorWithChildren',
  );

  if (callExpressions.length === 0) {
    return;
  }

  invariant(callExpressions.length === 1, 'Only one call expression allowed');

  // Remove dependencies and exports argument as well as createGenerator
  const callExpression = callExpressions.nodes()[0];

  invariant(callExpression.arguments.length === 1);

  const callExpressionArgument = callExpression.arguments[0];

  invariant(callExpressionArgument.type === 'ObjectExpression');

  const argsToMigrate: js.ObjectProperty[] = [];
  let createGeneratorToMigrate: js.ObjectMethod | undefined;

  callExpressionArgument.properties = callExpressionArgument.properties.filter(
    (p) => {
      if (p.type === 'ObjectProperty') {
        const key = getMaybeIdentifierName(p.key);
        if (key && ['dependencies', 'exports'].includes(key)) {
          argsToMigrate.push(p);
          return false;
        }
        return true;
      }
      if (p.type === 'ObjectMethod') {
        if (p.key.type === 'Identifier' && p.key.name === 'createGenerator') {
          createGeneratorToMigrate = p;
          return false;
        }
      }

      return true;
    },
  );

  callExpressionArgument.properties.push(
    j.objectMethod(
      'method',
      j.identifier('buildTasks'),
      [j.identifier('taskBuilder'), j.identifier('descriptor')],
      j.blockStatement([
        j.expressionStatement(
          j.callExpression(j.identifier('taskBuilder.addTask'), [
            j.callExpression(j.identifier('createMainTask'), [
              j.identifier('descriptor'),
            ]),
          ]),
        ),
      ]),
    ),
  );

  // Add descriptor type if missing
  const descriptorType = root.find(j.TSTypeAliasDeclaration, {
    id: { name: 'Descriptor' },
  });

  if (!descriptorType.length) {
    // find descriptor schema declaration
    const descriptorSchema = root.find(j.VariableDeclarator, {
      id: { name: 'descriptorSchema' },
    });
    invariant(descriptorSchema.length === 1);

    // add type Descriptor
    descriptorSchema
      .closest(j.VariableDeclaration)
      .insertAfter(
        j.tsTypeAliasDeclaration(
          j.identifier('Descriptor'),
          j.tsTypeReference(
            j.identifier('z.infer'),
            j.tsTypeParameterInstantiation([
              j.tsTypeQuery(j.identifier('descriptorSchema')),
            ]),
          ),
        ),
      );
  }

  // Create createMainTask function
  invariant(createGeneratorToMigrate);
  const descriptorArgs = createGeneratorToMigrate.params[0];
  const dependencyArgs = createGeneratorToMigrate.params[1];

  if (
    descriptorArgs.type === 'Identifier' ||
    descriptorArgs.type === 'ObjectPattern'
  ) {
    descriptorArgs.typeAnnotation = j.tsTypeAnnotation(
      j.tsTypeReference(j.identifier('Descriptor')),
    );
  }

  const runFunction = j.objectMethod(
    'method',
    j.identifier('run'),
    [dependencyArgs],
    createGeneratorToMigrate.body,
  );

  const createMainTask = j.callExpression(
    j.identifier('createTaskConfigBuilder'),
    [
      j.arrowFunctionExpression(
        descriptorArgs ? [descriptorArgs] : [],
        j.parenthesizedExpression(
          j.objectExpression([
            j.objectProperty(j.identifier('name'), j.stringLiteral('main')),
            ...argsToMigrate,
            runFunction,
          ]),
        ),
      ),
    ],
  );

  callExpressions
    .closest(j.VariableDeclaration)
    .insertBefore(
      j.variableDeclaration('const', [
        j.variableDeclarator(j.identifier('createMainTask'), createMainTask),
      ]),
    );

  // Rename createGeneratorWithChildren to createGeneratorWithTasks
  const createGeneratorWithChildren = root.find(
    j.Identifier,
    (n) => n.name === 'createGeneratorWithChildren',
  );
  createGeneratorWithChildren.forEach((path) => {
    path.replace(j.identifier('createGeneratorWithTasks'));
  });

  // Add import for createMainTask
  const importDeclarations = root.find(
    j.ImportDeclaration,
    (n) => n.source.value === '@halfdomelabs/sync',
  );

  importDeclarations
    .nodes()[0]
    .specifiers?.push(
      j.importSpecifier(j.identifier('createTaskConfigBuilder')),
    );

  return root.toSource();
};

export default transform;
