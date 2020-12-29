export interface FormatterProvider {
  format: (input: string, extension: string) => Promise<string> | string;
}
