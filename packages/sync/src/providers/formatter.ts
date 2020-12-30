import { createProviderType } from '../core/provider';

export interface FormatterProvider {
  format: (input: string, fullPath: string) => Promise<string> | string;
}

export const formatterProvider = createProviderType<FormatterProvider>(
  'formatter'
);
