import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { RefExpressionParser } from '#src/references/expression-types.js';

import { PluginSpecStore } from '#src/plugins/index.js';
import { extractDefinitionRefs } from '#src/references/extract-definition-refs.js';
import {
  createDefinitionSchemaParserContext,
  definitionSchema,
} from '#src/schema/creator/schema-creator.js';
import { stubParser } from '#src/testing/expression-stub-parser.test-helper.js';
import {
  FailingParser,
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

  function buildInput(
    schema: z.ZodType,
    data: unknown,
  ): {
    definition: unknown;
    pluginStore: PluginSpecStore;
    expressions: ReturnType<typeof extractDefinitionRefs>['expressions'];
  } {
    const parsed = schema.parse(data);
    const refPayload = extractDefinitionRefs(schema, parsed);
    return {
      definition: parsed,
      pluginStore,
      expressions: refPayload.expressions,
    };
  }

  it('returns empty array when schema has no expressions', () => {
    const schema = z.object({ name: z.string() });
    const issues = collectExpressionIssues(
      buildInput(schema, { name: 'test' }),
    );
    expect(issues).toEqual([]);
  });

  it('returns empty array when expression parser produces no warnings', () => {
    const schema = createSchemaWithExpression(stubParser);
    const issues = collectExpressionIssues(
      buildInput(schema, {
        name: 'test',
        condition: 'model.id === auth.userId',
      }),
    );
    expect(issues).toEqual([]);
  });

  it('maps expression warnings to definition issues with warning severity', () => {
    const warningParser = new WarningParser([
      { message: 'Field does not exist' },
      { message: 'Role not defined', start: 10, end: 20 },
    ]);
    const schema = createSchemaWithExpression(warningParser);

    const issues = collectExpressionIssues(
      buildInput(schema, { name: 'test', condition: 'some expression' }),
    );

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

    const issues = collectExpressionIssues(
      buildInput(schema, {
        rules: [
          { name: 'rule1', condition: 'expr1' },
          { name: 'rule2', condition: 'expr2' },
        ],
      }),
    );

    expect(issues).toHaveLength(2);
    expect(issues[0]?.path).toEqual(['rules', 0, 'condition']);
    expect(issues[1]?.path).toEqual(['rules', 1, 'condition']);
  });

  it('returns parse error as warning when parse fails', () => {
    const failingParser = new FailingParser();
    const schema = createSchemaWithExpression(failingParser);

    const issues = collectExpressionIssues(
      buildInput(schema, { name: 'test', condition: 'bad expression' }),
    );

    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message: 'Parse failed',
      path: ['condition'],
      severity: 'warning',
    });
  });

  it('returns empty array when schema has no expression annotations', () => {
    const issues = collectExpressionIssues({
      definition: 'not an object',
      pluginStore,
      expressions: [],
    });
    expect(issues).toEqual([]);
  });
});
