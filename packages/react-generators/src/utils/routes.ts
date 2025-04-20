import type { TsCodeFragment } from '@halfdomelabs/core-generators';

import { tsCodeFragment, tsImportBuilder } from '@halfdomelabs/core-generators';

export function createRouteElement(
  componentName: string,
  componentPath: string,
): TsCodeFragment {
  return tsCodeFragment(
    `<${componentName} />`,
    tsImportBuilder().default(componentName).from(componentPath),
  );
}
