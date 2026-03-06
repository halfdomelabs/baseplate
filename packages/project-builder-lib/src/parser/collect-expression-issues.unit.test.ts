import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { RefExpressionParser } from '#src/references/expression-types.js';

import { PluginSpecStore } from '#src/plugins/index.js';
import {
  createDefinitionSchemaParserContext,
  definitionSchema,
} from '#src/schema/creator/schema-creator.js';
import { stubParser } from '#src/testing/expression-stub-parser.test-helper.js';
import {
  ThrowingParser,
  WarningParser,
} from '#src/testing/expression-warning-parser.test-helper.js';

import { collectExpressionIssues } from './collect-expression-issues.js';

describe('collectExpressionIssues', () => {
  const pluginStore = new PluginSpecStore();

  function createSchemaWithExpression(
    parser: RefExpressionParser<string>,
  ): z.ZodType {
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        name: z.string(),
        condition: ctx.withExpression(parser),
      }),
    );
    return schemaCreator(
      createDefinitionSchemaParserContext({ plugins: pluginStore }),
    );
  }

  it('returns empty array when schema has no expressions', () => {
    const schema = z.object({ name: z.string() });
    const issues = collectExpressionIssues(
      schema,
      { name: 'test' },
      pluginStore,
    );
    expect(issues).toEqual([]);
  });

  it('returns empty array when expression parser produces no warnings', () => {
    const schema = createSchemaWithExpression(stubParser);
    const data = { name: 'test', condition: 'model.id === auth.userId' };

    const issues = collectExpressionIssues(schema, data, pluginStore);
    expect(issues).toEqual([]);
  });

  it('maps expression warnings to definition issues with warning severity', () => {
    const warningParser = new WarningParser([
      { message: 'Field does not exist' },
      { message: 'Role not defined', start: 10, end: 20 },
    ]);
    const schema = createSchemaWithExpression(warningParser);
    const data = { name: 'test', condition: 'some expression' };

    const issues = collectExpressionIssues(schema, data, pluginStore);

    expect(issues).toHaveLength(2);
    expect(issues[0]).toEqual({
      message: 'Field does not exist',
      path: ['condition'],
      severity: 'warning',
    });
    expect(issues[1]).toEqual({
      message: 'Role not defined',
      path: ['condition'],
      severity: 'warning',
    });
  });

  it('collects warnings from multiple expressions', () => {
    const warningParser = new WarningParser([{ message: 'Invalid field' }]);
    const schemaCreator = definitionSchema((ctx) =>
      z.object({
        rules: z.array(
          z.object({
            name: z.string(),
            condition: ctx.withExpression(warningParser),
          }),
        ),
      }),
    );
    const schema = schemaCreator(
      createDefinitionSchemaParserContext({ plugins: pluginStore }),
    );
    const data = {
      rules: [
        { name: 'rule1', condition: 'expr1' },
        { name: 'rule2', condition: 'expr2' },
      ],
    };

    const issues = collectExpressionIssues(schema, data, pluginStore);

    expect(issues).toHaveLength(2);
    expect(issues[0]?.path).toEqual(['rules', 0, 'condition']);
    expect(issues[1]?.path).toEqual(['rules', 1, 'condition']);
  });

  it('throws when parser.parse throws', () => {
    const throwingParser = new ThrowingParser();
    const schema = createSchemaWithExpression(throwingParser);
    const data = { name: 'test', condition: 'bad expression' };

    expect(() => collectExpressionIssues(schema, data, pluginStore)).toThrow(
      'Parse failed',
    );
  });

  it('returns empty array when schema has no expression annotations', () => {
    const schema = z.object({ name: z.string() });
    const issues = collectExpressionIssues(
      schema,
      'not an object',
      pluginStore,
    );
    expect(issues).toEqual([]);
  });
});
