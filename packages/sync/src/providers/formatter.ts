import { createProviderType } from '../core/provider.js';
import { Logger } from '../utils/evented-logger.js';

export interface FormatterProvider {
  format: (
    input: string,
    fullPath: string,
    logger: Logger
  ) => Promise<string> | string;
}

export const formatterProvider =
  createProviderType<FormatterProvider>('formatter');
