import type { TypescriptCodeBlock } from '@halfdomelabs/core-generators';

import { TypescriptCodeUtils } from '@halfdomelabs/core-generators';

import type { ReactComponentsProvider } from '@src/generators/core/react-components/index.js';

export interface DataLoader {
  loader: TypescriptCodeBlock;
  loaderValueName: string;
  loaderErrorName: string;
}

export function printDataLoaders(
  loaders: DataLoader[],
  reactComponents: ReactComponentsProvider,
): {
  loader: TypescriptCodeBlock;
  gate: TypescriptCodeBlock;
  dataParts: string;
  errorParts: string;
} {
  if (loaders.length === 0) {
    return {
      loader: TypescriptCodeUtils.createBlock(''),
      gate: TypescriptCodeUtils.createBlock(''),
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
    loader: TypescriptCodeUtils.mergeBlocks(
      loaders.map((loader) => loader.loader),
      '\n\n',
    ),
    gate: TypescriptCodeUtils.formatBlock(
      `if (DATA_PARTS) {
        return <ErrorableLoader error={ERROR_PARTS} />;
      }`,
      {
        DATA_PARTS: dataParts,
        ERROR_PARTS: errorParts,
      },
      {
        importText: [`import { ErrorableLoader } from '%react-components'`],
        importMappers: [reactComponents],
      },
    ),
  };
}
