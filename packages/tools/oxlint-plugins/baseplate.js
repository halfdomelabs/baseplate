/**
 * Flags dependencies declared in a `createGeneratorTask` `dependencies` object
 * that the `run` function does not destructure. Unused destructured variables
 * are left to `no-unused-vars`.
 */
const noUnusedGeneratorDependencies = {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow unused dependencies in createGeneratorTask dependencies object.',
    },
    fixable: 'code',
    schema: [],
    messages: {
      unusedDependency:
        'Dependency "{{dependencyName}}" declared but not destructured in run function.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        const { callee } = node;
        const isCreateGeneratorTaskCall =
          (callee.type === 'Identifier' &&
            callee.name === 'createGeneratorTask') ||
          (callee.type === 'MemberExpression' &&
            callee.property.type === 'Identifier' &&
            callee.property.name === 'createGeneratorTask');

        const taskConfig = node.arguments[0];
        if (
          !isCreateGeneratorTaskCall ||
          taskConfig?.type !== 'ObjectExpression'
        ) {
          return;
        }

        let dependenciesNode = null;
        let runFunctionNode = null;
        for (const prop of taskConfig.properties) {
          if (prop.type !== 'Property' || prop.key.type !== 'Identifier') {
            continue;
          }
          if (
            prop.key.name === 'dependencies' &&
            prop.value.type === 'ObjectExpression'
          ) {
            dependenciesNode = prop.value;
          } else if (
            prop.key.name === 'run' &&
            (prop.value.type === 'FunctionExpression' ||
              prop.value.type === 'ArrowFunctionExpression')
          ) {
            runFunctionNode = prop.value;
          }
        }

        if (!dependenciesNode || !runFunctionNode) {
          return;
        }

        const destructuredRunParams = new Set();
        const firstParam = runFunctionNode.params[0];
        if (firstParam?.type === 'ObjectPattern') {
          for (const paramProp of firstParam.properties) {
            if (
              paramProp.type === 'Property' &&
              paramProp.key.type === 'Identifier'
            ) {
              destructuredRunParams.add(paramProp.key.name);
            }
          }
        }

        for (const depProp of dependenciesNode.properties) {
          if (
            depProp.type !== 'Property' ||
            depProp.key.type !== 'Identifier'
          ) {
            continue;
          }
          const dependencyName = depProp.key.name;
          if (destructuredRunParams.has(dependencyName)) {
            continue;
          }
          context.report({
            node: depProp,
            messageId: 'unusedDependency',
            data: { dependencyName },
            fix(fixer) {
              const nextToken = context.sourceCode.getTokenAfter(depProp);
              if (nextToken?.type === 'Punctuator' && nextToken.value === ',') {
                return fixer.removeRange([
                  depProp.range[0],
                  nextToken.range[1],
                ]);
              }
              return fixer.remove(depProp);
            },
          });
        }
      },
    };
  },
};

export default {
  meta: { name: 'baseplate' },
  rules: {
    'no-unused-generator-dependencies': noUnusedGeneratorDependencies,
  },
};
