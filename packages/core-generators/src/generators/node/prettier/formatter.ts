export interface FormatterInput {
  prettierLibPath: string;
  input: string;
  config: Record<string, unknown>;
}

interface PrettierModule {
  format(input: string, config: Record<string, unknown>): string;
}

export default function format({
  prettierLibPath,
  input,
  config,
}: FormatterInput): string {
  const prettierLib = module.require(
    prettierLibPath || 'prettier'
  ) as PrettierModule;

  return prettierLib.format(input, config);
}
