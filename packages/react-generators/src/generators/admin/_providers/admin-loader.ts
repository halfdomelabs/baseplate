import type { TsCodeFragment } from '@baseplate-dev/core-generators';

import { tsCodeFragment, TsCodeUtils } from '@baseplate-dev/core-generators';

import type { ReactComponentsImportsProvider } from '#src/generators/core/react-components/react-components.generator.js';

export interface DataLoader {
  loader: TsCodeFragment;
  loaderValueName: string;
  loaderErrorName: string;
}

export function printDataLoaders(
  loaders: DataLoader[],
  reactComponentsImports: ReactComponentsImportsProvider,
): {
  loader: TsCodeFragment;
  gate: TsCodeFragment;
  dataParts: string;
  errorParts: string;
} {
  if (loaders.length === 0) {
    return {
      loader: tsCodeFragment(''),
      gate: tsCodeFragment(''),
      dataParts: '',
      errorParts: '',
    };
  }

  const dataParts = loaders
    .map((loader) => `!${loader.loaderValueName}`)
    .join(' || ');

  const errorParts = loaders
    .map((loader) => loader.loaderErrorName)
    .join(' ?? ');

  return {
    dataParts,
    errorParts,
    loader: TsCodeUtils.mergeFragments(
      new Map(loaders.map((loader) => [loader.loaderValueName, loader.loader])),
      '\n\n',
    ),
    gate: TsCodeUtils.templateWithImports(
      reactComponentsImports.ErrorableLoader.declaration(),
    )`if (${dataParts}) {
        return <ErrorableLoader error={${errorParts}} />;
      }`,
  };
}
