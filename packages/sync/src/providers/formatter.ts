import { createProviderType } from '../core/provider';

export interface FormatterProvider {
  format: (input: string, extension: string) => Promise<string> | string;
}

export const formatterProvider = createProviderType<FormatterProvider>(
  'formatter'
);
