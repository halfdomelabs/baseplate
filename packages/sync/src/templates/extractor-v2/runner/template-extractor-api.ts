import type { TemplateExtractorContext } from './template-extractor-context.js';
import type { TemplateExtractorFileContainer } from './template-extractor-file-container.js';

/**
 * The API for the template extractor with helper functions for writing files.
 */
export class TemplateExtractorApi {
  constructor(
    protected context: TemplateExtractorContext,
    protected fileContainer: TemplateExtractorFileContainer,
    protected extractorName: string,
  ) {}
}
