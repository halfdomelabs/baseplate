import type { PluginModuleWithKey } from '#src/plugins/imports/types.js';

import { createPluginModule } from '#src/plugins/imports/types.js';

import { expressionParserSpec } from '../expression-parser-spec.js';
import { authorizerExpressionParser } from './authorizer/authorizer-expression-parser.js';

/**
 * Core module that registers built-in expression parsers.
 *
 * This module is included in every consumer's coreModules array
 * (server, web, CLI, tests) to ensure the authorizer expression parser
 * is available for schemas that use `withExpression(authorizerExpressionRef, ...)`.
 */
const registerExpressionParsersModule = createPluginModule({
  name: 'register-expression-parsers',
  dependencies: {
    expressionParsers: expressionParserSpec,
  },
  initialize: ({ expressionParsers }) => {
    expressionParsers.parsers.set(
      authorizerExpressionParser.name,
      authorizerExpressionParser,
    );
  },
});

/**
 * Core module with key for inclusion in PluginStore.coreModules.
 */
export const expressionParserCoreModule: PluginModuleWithKey = {
  key: 'core/lib/expression-parsers',
  pluginKey: 'core',
  module: registerExpressionParsersModule,
};
