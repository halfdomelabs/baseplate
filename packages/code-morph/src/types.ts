import type { SourceFile } from 'ts-morph';
import type z from 'zod';

type TransformFunction<Options extends Record<string, string | undefined>> = (
  file: SourceFile,
  options: Options,
) => void;

interface MorpherOption<Optional extends boolean> {
  optional: Optional;
  description?: string;
  validation?: z.ZodString;
}

export interface TypescriptMorpher<
  Options extends Record<string, MorpherOption<boolean>> = Record<
    string,
    MorpherOption<boolean>
  >,
> {
  name: string;
  description?: string;
  options: Options;
  transform: TransformFunction<{
    [key in keyof Options]: Options[key] extends MorpherOption<true>
      ? string | undefined
      : string;
  }>;
  pathGlobs?: string[];
}

export function createTypescriptMorpher<
  Options extends Record<string, MorpherOption<boolean>>,
>(morpher: TypescriptMorpher<Options>): TypescriptMorpher<Options> {
  return morpher;
}
