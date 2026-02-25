import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  definitionFieldIssueRegistry,
  withIssueChecker,
} from '#src/schema/creator/definition-issue-registry.js';

import {
  collectFieldIssues,
  partitionIssuesBySeverity,
} from './collect-definition-issues.js';

describe('collectFieldIssues', () => {
  it('returns empty array when no checkers are registered', () => {
    const schema = z.object({ name: z.string() });
    const issues = collectFieldIssues(schema, { name: 'test' });
    expect(issues).toEqual([]);
  });

  it('collects issues from a registered checker', () => {
    const innerSchema = z.array(z.string()).apply(
      withIssueChecker((value, ctx) => {
        const arr = value;
        if (arr.length === 0) {
          return [
            {
              message: 'Array must not be empty.',
              path: ctx.path,
              severity: 'error',
            },
          ];
        }
        return [];
      }),
    );

    const schema = z.object({ items: innerSchema });

    const issues = collectFieldIssues(schema, { items: [] });
    expect(issues).toHaveLength(1);
    expect(issues[0]).toEqual({
      message: 'Array must not be empty.',
      path: ['items'],
      severity: 'error',
    });
  });

  it('returns empty array when checker produces no issues', () => {
    const innerSchema = z.array(z.string()).apply(
      withIssueChecker((value) => {
        const arr = value;
        if (arr.length === 0) {
          return [
            {
              message: 'Array must not be empty.',
              path: [],
              severity: 'warning',
            },
          ];
        }
        return [];
      }),
    );

    const schema = z.object({ items: innerSchema });

    const issues = collectFieldIssues(schema, { items: ['something'] });
    expect(issues).toEqual([]);
  });

  it('collects issues from multiple checkers on the same node', () => {
    const innerSchema = z.object({
      count: z.number(),
      label: z.string(),
    });

    definitionFieldIssueRegistry.add(innerSchema, (value, ctx) => {
      const obj = value as { count: number };
      if (obj.count < 0) {
        return [
          {
            message: 'Count must be non-negative.',
            path: [...ctx.path, 'count'],
            severity: 'error',
          },
        ];
      }
      return [];
    });

    definitionFieldIssueRegistry.add(innerSchema, (value, ctx) => {
      const obj = value as { label: string };
      if (obj.label === '') {
        return [
          {
            message: 'Label must not be empty.',
            path: [...ctx.path, 'label'],
            severity: 'warning',
          },
        ];
      }
      return [];
    });

    const schema = z.object({ data: innerSchema });

    const issues = collectFieldIssues(schema, {
      data: { count: -1, label: '' },
    });
    expect(issues).toHaveLength(2);
    expect(issues[0]?.message).toBe('Count must be non-negative.');
    expect(issues[1]?.message).toBe('Label must not be empty.');
  });

  it('collects issues from nested schemas', () => {
    const leafSchema = z.number().apply(
      withIssueChecker((value, ctx) => {
        if (value > 100) {
          return [
            {
              message: 'Value too large.',
              path: ctx.path,
              severity: 'warning',
            },
          ];
        }
        return [];
      }),
    );

    const schema = z.object({
      outer: z.object({
        inner: z.object({
          value: leafSchema,
        }),
      }),
    });

    const issues = collectFieldIssues(schema, {
      outer: { inner: { value: 200 } },
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toEqual(['outer', 'inner', 'value']);
  });

  it('collects issues from array elements', () => {
    const itemSchema = z.object({ name: z.string() }).apply(
      withIssueChecker((value, ctx) => {
        const item = value as { name: string };
        if (item.name === '') {
          return [
            {
              message: 'Name must not be empty.',
              path: ctx.path,
              severity: 'error',
            },
          ];
        }
        return [];
      }),
    );

    const schema = z.object({ items: z.array(itemSchema) });

    const issues = collectFieldIssues(schema, {
      items: [{ name: 'good' }, { name: '' }, { name: 'also good' }],
    });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toEqual(['items', 1]);
  });

  it('supports issues with auto-fix proposals', () => {
    const innerSchema = z.string().apply(
      withIssueChecker((value, ctx) => {
        const str = value;
        if (str.includes(' ')) {
          return [
            {
              message: 'Value must not contain spaces.',
              path: ctx.path,
              severity: 'error',
              fix: {
                label: 'Remove spaces',
                apply: (v) => (v as string).replaceAll(' ', ''),
              },
            },
          ];
        }
        return [];
      }),
    );

    const schema = z.object({ name: innerSchema });

    const issues = collectFieldIssues(schema, { name: 'hello world' });
    expect(issues).toHaveLength(1);
    expect(issues[0]?.fix).toBeDefined();
    expect(issues[0]?.fix?.label).toBe('Remove spaces');
    expect(issues[0]?.fix?.apply('hello world')).toBe('helloworld');
  });
});

describe('partitionIssuesBySeverity', () => {
  it('returns empty arrays when no issues', () => {
    const result = partitionIssuesBySeverity([]);
    expect(result).toEqual({ errors: [], warnings: [] });
  });

  it('separates errors from warnings', () => {
    const issues = [
      { message: 'Error 1', path: ['a'], severity: 'error' as const },
      { message: 'Warning 1', path: ['b'], severity: 'warning' as const },
      { message: 'Error 2', path: ['c'], severity: 'error' as const },
      { message: 'Warning 2', path: ['d'], severity: 'warning' as const },
    ];

    const result = partitionIssuesBySeverity(issues);
    expect(result.errors).toHaveLength(2);
    expect(result.warnings).toHaveLength(2);
    expect(result.errors[0]?.message).toBe('Error 1');
    expect(result.errors[1]?.message).toBe('Error 2');
    expect(result.warnings[0]?.message).toBe('Warning 1');
    expect(result.warnings[1]?.message).toBe('Warning 2');
  });

  it('handles all errors', () => {
    const issues = [
      { message: 'Error 1', path: ['a'], severity: 'error' as const },
      { message: 'Error 2', path: ['b'], severity: 'error' as const },
    ];

    const result = partitionIssuesBySeverity(issues);
    expect(result.errors).toHaveLength(2);
    expect(result.warnings).toHaveLength(0);
  });

  it('handles all warnings', () => {
    const issues = [
      { message: 'Warning 1', path: ['a'], severity: 'warning' as const },
      { message: 'Warning 2', path: ['b'], severity: 'warning' as const },
    ];

    const result = partitionIssuesBySeverity(issues);
    expect(result.errors).toHaveLength(0);
    expect(result.warnings).toHaveLength(2);
  });
});
