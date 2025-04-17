import type { SourceFile } from 'ts-morph';
import type z from 'zod';

export interface MorpherContext {
  packageDirectory: string;
}

/**
 * The transform function for a morpher.
 */
type TransformFunction<Options extends Record<string, string | undefined>> = (
  file: SourceFile,
  options: Options,
  context: MorpherContext,
) => void;

/**
 * The option for a morpher.
 */
export interface MorpherOption<Optional extends boolean> {
  /**
   * Whether the option is optional.
   */
  optional: Optional;
  /**
   * The description of the option.
   */
  description?: string;
  /**
   * The validation schema for the option.
   */
  validation?: z.ZodString;
}

/**
 * The TypescriptMorpher provides a way to morph typescript code
 */
export interface TypescriptMorpher<
  Options extends Record<string, MorpherOption<boolean>> = Record<
    string,
    MorpherOption<boolean>
  >,
> {
  /**
   * The name of the morpher.
   */
  name: string;
  /**
   * The description of the morpher.
   */
  description?: string;
  /**
   * The options for the morpher.
   */
  options: Options;
  /**
   * The transform function for the morpher.
   */
  transform: TransformFunction<{
    [key in keyof Options]: Options[key] extends MorpherOption<true>
      ? string | undefined
      : string;
  }>;
  /**
   * The path globs to run the morpher on.
   */
  pathGlobs?: string[];
  /**
   * Use ts-morph project save method.
   *
   * This enables the morpher to rename files/refactor other files. However,
   * prettier will not be used to format the files.
   */
  saveUsingTsMorph?: boolean;
}

/**
 * Creates a TypescriptMorpher.
 *
 * @param morpher - The morpher to create.
 * @returns The created morpher.
 */
export function createTypescriptMorpher<
  Options extends Record<string, MorpherOption<boolean>>,
>(morpher: TypescriptMorpher<Options>): TypescriptMorpher<Options> {
  return morpher;
}
