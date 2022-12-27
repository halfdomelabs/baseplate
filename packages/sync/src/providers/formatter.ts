import { createProviderType } from '../core/provider';
import { Logger } from '../utils/evented-logger';

export interface FormatterProvider {
  format: (
    input: string,
    fullPath: string,
    logger: Logger
  ) => Promise<string> | string;
}

export const formatterProvider =
  createProviderType<FormatterProvider>('formatter');
