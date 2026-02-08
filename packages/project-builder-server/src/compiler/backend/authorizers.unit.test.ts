import { parseAuthorizerExpression } from '@baseplate-dev/project-builder-lib';
import { describe, expect, it } from 'vitest';

import { generateAuthorizerExpressionCode } from './authorizers.js';

describe('generateAuthorizerExpressionCode', () => {
  function generate(expression: string): string {
    const parsed = parseAuthorizerExpression(expression);
    return generateAuthorizerExpressionCode(parsed.ast);
  }

  describe('field comparisons', () => {
    it('should transform model field === userId', () => {
      expect(generate('model.id === userId')).toBe(
        'model.id === ctx.auth.userId',
      );
    });

    it('should transform different field names', () => {
      expect(generate('model.authorId === userId')).toBe(
        'model.authorId === ctx.auth.userId',
      );
    });
  });

  describe('hasRole', () => {
    it('should transform hasRole to ctx.auth.hasRole', () => {
      expect(generate("hasRole('admin')")).toBe("ctx.auth.hasRole('admin')");
    });

    it('should handle different role names', () => {
      expect(generate("hasRole('moderator')")).toBe(
        "ctx.auth.hasRole('moderator')",
      );
    });
  });

  describe('hasSomeRole', () => {
    it('should transform hasSomeRole to ctx.auth.hasSomeRole', () => {
      expect(generate("hasSomeRole(['admin', 'moderator'])")).toBe(
        "ctx.auth.hasSomeRole(['admin', 'moderator'])",
      );
    });

    it('should handle single role array', () => {
      expect(generate("hasSomeRole(['user'])")).toBe(
        "ctx.auth.hasSomeRole(['user'])",
      );
    });
  });

  describe('logical operators', () => {
    it('should parenthesize OR expressions', () => {
      expect(generate("model.id === userId || hasRole('admin')")).toBe(
        "(model.id === ctx.auth.userId) || (ctx.auth.hasRole('admin'))",
      );
    });

    it('should parenthesize AND expressions', () => {
      expect(generate("model.id === userId && hasRole('user')")).toBe(
        "(model.id === ctx.auth.userId) && (ctx.auth.hasRole('user'))",
      );
    });

    it('should handle nested logical expressions', () => {
      expect(
        generate(
          "model.id === userId || hasRole('admin') || hasRole('moderator')",
        ),
      ).toBe(
        "((model.id === ctx.auth.userId) || (ctx.auth.hasRole('admin'))) || (ctx.auth.hasRole('moderator'))",
      );
    });
  });
});
