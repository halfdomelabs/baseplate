import type { SourceFile } from 'ts-morph';
import type z from 'zod';

type TransformFunction<Options extends z.AnyZodObject> = (
  file: SourceFile,
  options: z.infer<Options>,
) => void;

export interface TypescriptMorpher<
  Options extends z.AnyZodObject = z.AnyZodObject,
> {
  name: string;
  description?: string;
  optionSchema: Options;
  transform: TransformFunction<Options>;
}

export function createTypescriptMorpher<Options extends z.AnyZodObject>(
  morpher: TypescriptMorpher<Options>,
): TypescriptMorpher<Options> {
  return morpher;
}
