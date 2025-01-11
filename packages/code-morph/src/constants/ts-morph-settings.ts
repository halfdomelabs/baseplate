import {
  IndentationText,
  type ManipulationSettings,
  QuoteKind,
} from 'ts-morph';

export const TS_MORPH_MANIPULATION_SETTINGS: Partial<ManipulationSettings> = {
  indentationText: IndentationText.TwoSpaces,
  quoteKind: QuoteKind.Single,
  usePrefixAndSuffixTextForRename: true,
  // There is an issue with trailing commas (https://github.com/dsherret/ts-morph/issues/1603)
  useTrailingCommas: false,
};
