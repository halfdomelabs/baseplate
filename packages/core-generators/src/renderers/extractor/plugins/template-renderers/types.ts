import type { TsCodeFragment } from '#src/renderers/typescript/index.js';

/**
 * A task dependency such as import providers or paths used in the render function.
 */
export interface TemplateRendererTaskDependency {
  /**
   * The name of the dependency task (will be de-duplicated)..
   */
  name: string;
  /**
   * The expression to use to access the provider. (defaults to the name of the import)
   */
  providerExpression?: string;
  /**
   * The name of the value to import.
   */
  providerImportName: string;
  /**
   * The import specifier of the value.
   */
  providerImportSpecifier: string;
}

/**
 * A template renderer entry is a collection of information that describes
 * how to render a template or template group.
 */
export interface TemplateRendererEntry {
  /**
   * The name of the template or template group to render. (camelCased)
   */
  name: string;
  /**
   * The type of the render function used in the provider.
   */
  renderType: TsCodeFragment;
  /**
   * The task dependencies required for the render function.
   */
  taskDependencies: TemplateRendererTaskDependency[];
  /**
   * The function that renders the template.
   */
  renderFunction: TsCodeFragment;
}
