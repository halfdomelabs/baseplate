import type { TypescriptCodeExpression } from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';

export function createRouteElement(
  componentName: string,
  componentPath: string,
): TypescriptCodeExpression {
  return TypescriptCodeUtils.createExpression(
    `<${componentName} />`,
    `import ${componentName} from '${componentPath}'`,
  );
}
