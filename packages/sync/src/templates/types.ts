/**
 * The source content for a template file.
 */
export type TemplateFileSource =
  | {
      /**
       * The path to the template file.
       */
      path: string;
    }
  | {
      /**
       * The contents of the template file.
       */
      contents: string | Buffer;
    };

/**
 * Base fields for a template file.
 */
export interface TemplateFileBase {
  /**
   * The name of the template (must be unique within a generator).
   */
  name: string;
  /**
   * The source for the template file.
   */
  source: TemplateFileSource;
}
