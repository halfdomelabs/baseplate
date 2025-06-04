import type { Logger } from '#src/utils/evented-logger.js';

import type { TemplateExtractorConfigLookup } from './configs/template-extractor-config-lookup.js';

export interface TemplateFileExtractorContext {
  /**
   * A map of generator name to its info.
   */
  configLookup: TemplateExtractorConfigLookup;
  /**
   * The logger to use.
   */
  logger: Logger;
  /**
   * The base directory of the package.
   */
  baseDirectory: string;
}
