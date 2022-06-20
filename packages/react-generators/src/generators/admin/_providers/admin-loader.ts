import {
  TypescriptCodeBlock,
  TypescriptCodeUtils,
} from '@baseplate/core-generators';
import { ReactComponentsProvider } from '@src/generators/core/react-components';

export interface DataLoader {
  loader: TypescriptCodeBlock;
  loaderValueName: string;
  loaderErrorName: string;
}

export function printDataLoaders(
  loaders: DataLoader[],
  reactComponents: ReactComponentsProvider
): { loader: TypescriptCodeBlock; gate: TypescriptCodeBlock } {
  if (!loaders.length) {
    return {
      loader: TypescriptCodeUtils.createBlock(''),
      gate: TypescriptCodeUtils.createBlock(''),
    };
  }

  return {
    loader: TypescriptCodeUtils.mergeBlocks(
      loaders.map((loader) => loader.loader),
      '\n\n'
    ),
    gate: TypescriptCodeUtils.formatBlock(
      `if (DATA_PARTS) {
        return <ErrorableLoader error={ERROR_PARTS} />;
      }`,
      {
        DATA_PARTS: loaders
          .map((loader) => `!${loader.loaderValueName}`)
          .join(' || '),
        ERROR_PARTS: loaders
          .map((loader) => loader.loaderErrorName)
          .join(' || '),
      },
      {
        importText: [`import { ErrorableLoader } from '%react-components'`],
        importMappers: [reactComponents],
      }
    ),
  };
}
