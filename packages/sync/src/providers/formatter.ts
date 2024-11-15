import type { Logger } from '../utils/evented-logger.js';

import { createProviderType } from '../core/provider.js';

export type FormatFunction = (
  input: string,
  fullPath: string,
  logger: Logger,
) => Promise<string> | string;

export interface FormatterProvider {
  format: FormatFunction;
}

export const formatterProvider =
  createProviderType<FormatterProvider>('formatter');
