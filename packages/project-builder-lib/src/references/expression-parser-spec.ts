import { createFieldMapSpec } from '#src/plugins/utils/create-field-map-spec.js';

import type { RefExpressionParser } from './expression-types.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyExpressionParser = RefExpressionParser<any, any, any>;

/**
 * Plugin spec for registering expression parsers.
 *
 * Expression parsers handle parsing, validation, and rename detection
 * for expression fields in the project definition (e.g., authorizer
 * role expressions).
 *
 * Built-in parsers (authorizer expressions) are registered by core modules.
 * Plugins can register additional parsers during initialization.
 *
 * @example
 * ```typescript
 * createPluginModule({
 *   dependencies: { expressionParsers: expressionParserSpec },
 *   initialize: ({ expressionParsers }) => {
 *     expressionParsers.parsers.set('my-expression', myParser);
 *   },
 * });
 * ```
 */
export const expressionParserSpec = createFieldMapSpec(
  'core/expression-parsers',
  (t) => ({
    parsers: t.map<string, AnyExpressionParser>(),
  }),
  {
    use: (values) => ({
      getParser: (name: string): AnyExpressionParser | undefined =>
        values.parsers.get(name),
    }),
  },
);
