import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsCodeFragment, tsImportBuilder } from '@baseplate-dev/core-generators';

export function createRouteElement(
  componentName: string,
  componentPath: string,
): TsCodeFragment {
  return tsCodeFragment(
    `<${componentName} />`,
    tsImportBuilder().default(componentName).from(componentPath),
  );
}
