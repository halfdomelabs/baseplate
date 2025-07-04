// @ts-check

/**
 * ESLint rule to disallow unused dependencies in `createGeneratorTask`'s `dependencies` object.
 *
 * This rule checks if a dependency declared in the `dependencies` object of a `createGeneratorTask`
 * is actually destructured and used in the `run` function's parameters.
 * It assumes that `no-unused-vars` will catch any unused destructured variables within the `run` function body.
 *
 * @type {import('eslint').Rule.RuleModule}
 */
export default {
  meta: {
    type: 'suggestion',
    docs: {
      description:
        'Disallow unused dependencies in createGeneratorTask dependencies object.',
      category: 'Possible Errors',
      recommended: false,
    },
    fixable: 'code', // Indicate that this rule is auto-fixable
    schema: [], // No options for this rule
    messages: {
      unusedDependency:
        'Dependency "{{dependencyName}}" declared but not destructured in run function.',
    },
  },
  create(context) {
    return {
      CallExpression(node) {
        // Check if this is a call to `createGeneratorTask`
        // The callee can be `createGeneratorTask` directly or `someObject.createGeneratorTask`
        const callee = node.callee;
        let isCreateGeneratorTaskCall = false;

        if (
          callee.type === 'Identifier' &&
          callee.name === 'createGeneratorTask'
        ) {
          isCreateGeneratorTaskCall = true;
        } else if (
          callee.type === 'MemberExpression' &&
          callee.property.type === 'Identifier' &&
          callee.property.name === 'createGeneratorTask'
        ) {
          isCreateGeneratorTaskCall = true;
        }

        if (
          isCreateGeneratorTaskCall &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'ObjectExpression'
        ) {
          const taskConfig = node.arguments[0];
          let dependenciesNode = null;
          let runFunctionNode = null;

          // Find 'dependencies' and 'run' properties within the task configuration object
          for (const prop of taskConfig.properties) {
            if (prop.type === 'Property' && prop.key.type === 'Identifier') {
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
          }

          if (dependenciesNode && runFunctionNode) {
            const destructuredRunParams = new Set();
            // Check if the run function has parameters and if the first one is an ObjectPattern (destructuring)
            if (
              runFunctionNode.params.length > 0 &&
              runFunctionNode.params[0].type === 'ObjectPattern'
            ) {
              for (const paramProp of runFunctionNode.params[0].properties) {
                // Ensure it's a simple property (e.g., { foo }) not a rest element or nested destructuring
                if (
                  paramProp.type === 'Property' &&
                  paramProp.key.type === 'Identifier'
                ) {
                  destructuredRunParams.add(paramProp.key.name);
                }
              }
            }

            // Iterate over declared dependencies and check if they are destructured in the run function
            for (const depProp of dependenciesNode.properties) {
              if (
                depProp.type === 'Property' &&
                depProp.key.type === 'Identifier'
              ) {
                const dependencyName = depProp.key.name;

                // If the dependency is declared but NOT found in the destructured parameters of the run function
                if (!destructuredRunParams.has(dependencyName)) {
                  context.report({
                    node: depProp, // Report on the specific dependency property
                    messageId: 'unusedDependency',
                    data: { dependencyName },
                    fix(fixer) {
                      // Remove the entire property from the dependencies object
                      // This handles commas and whitespace correctly for object properties.
                      const sourceCode = context.sourceCode;
                      const nextToken = sourceCode.getTokenAfter(depProp);

                      // If there's a comma after this property, remove it too
                      if (
                        nextToken &&
                        nextToken.type === 'Punctuator' &&
                        nextToken.value === ',' &&
                        depProp.range
                      ) {
                        return fixer.removeRange([
                          depProp.range[0],
                          nextToken.range[1],
                        ]);
                      }

                      return fixer.remove(depProp);
                    },
                  });
                }
              }
            }
          }
        }
      },
    };
  },
};
