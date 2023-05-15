import {
  TypescriptCodeExpression,
  TypescriptCodeUtils,
} from '@halfdomelabs/core-generators';

export function createRouteElement(
  componentName: string,
  componentPath: string
): TypescriptCodeExpression {
  return TypescriptCodeUtils.createExpression(
    `<${componentName} />`,
    `import ${componentName} from '${componentPath}'`
  );
}
