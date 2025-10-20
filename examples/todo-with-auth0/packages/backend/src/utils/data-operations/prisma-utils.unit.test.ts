import { describe, expect, it } from 'vitest';

import { mergePrismaQueries } from './prisma-utils.js';

describe('mergePrismaQueries', () => {
  describe('basic merging', () => {
    it('should return empty object for empty array', () => {
      const result = mergePrismaQueries([]);
      expect(result).toEqual({});
    });

    it('should return empty object for queries without include', () => {
      const result = mergePrismaQueries([{}, {}, {}]);
      expect(result).toEqual({ include: {} });
    });

    it('should merge single query', () => {
      const result = mergePrismaQueries([{ include: { profile: true } }]);
      expect(result).toEqual({ include: { profile: true } });
    });

    it('should merge multiple simple includes', () => {
      const result = mergePrismaQueries([
        { include: { profile: true } },
        { include: { posts: true } },
        { include: { settings: true } },
      ]);
      expect(result).toEqual({
        include: { profile: true, posts: true, settings: true },
      });
    });

    it('should merge duplicate includes', () => {
      const result = mergePrismaQueries([
        { include: { profile: true } },
        { include: { profile: true } },
      ]);
      expect(result).toEqual({ include: { profile: true } });
    });
  });

  describe('nested includes', () => {
    it('should merge nested includes', () => {
      const result = mergePrismaQueries([
        { include: { posts: { include: { comments: true } } } },
        { include: { posts: { include: { author: true } } } },
      ]);
      expect(result).toEqual({
        include: {
          posts: { include: { comments: true, author: true } },
        },
      });
    });

    it('should merge deeply nested includes', () => {
      const result = mergePrismaQueries([
        {
          include: {
            posts: {
              include: { comments: { include: { user: true } } },
            },
          },
        },
        {
          include: {
            posts: {
              include: { comments: { include: { likes: true } } },
            },
          },
        },
      ]);
      expect(result).toEqual({
        include: {
          posts: {
            include: {
              comments: {
                include: { user: true, likes: true },
              },
            },
          },
        },
      });
    });

    it('should prefer nested include over simple true', () => {
      const result = mergePrismaQueries([
        { include: { posts: true } },
        { include: { posts: { include: { comments: true } } } },
      ]);
      expect(result).toEqual({
        include: { posts: { include: { comments: true } } },
      });
    });

    it('should prefer nested include when simple true comes second', () => {
      const result = mergePrismaQueries([
        { include: { posts: { include: { comments: true } } } },
        { include: { posts: true } },
      ]);
      expect(result).toEqual({
        include: { posts: { include: { comments: true } } },
      });
    });

    it('should merge mixed nested and simple includes', () => {
      const result = mergePrismaQueries([
        { include: { posts: { include: { comments: true } } } },
        { include: { profile: true } },
        { include: { posts: { include: { author: true } } } },
      ]);
      expect(result).toEqual({
        include: {
          posts: { include: { comments: true, author: true } },
          profile: true,
        },
      });
    });
  });

  describe('complex scenarios', () => {
    it('should handle complex multi-level merging', () => {
      const result = mergePrismaQueries([
        {
          include: {
            posts: {
              include: {
                comments: true,
                author: { include: { profile: true } },
              },
            },
          },
        },
        {
          include: {
            posts: {
              include: {
                tags: true,
                author: { include: { settings: true } },
              },
            },
          },
        },
        { include: { profile: true } },
      ]);
      expect(result).toEqual({
        include: {
          posts: {
            include: {
              comments: true,
              tags: true,
              author: {
                include: { profile: true, settings: true },
              },
            },
          },
          profile: true,
        },
      });
    });

    it('should handle empty include objects in queries', () => {
      const result = mergePrismaQueries([
        { include: {} },
        { include: { profile: true } },
        { include: {} },
      ]);
      expect(result).toEqual({ include: { profile: true } });
    });
  });

  describe('validation', () => {
    it('should reject includes with orderBy', () => {
      expect(() =>
        mergePrismaQueries([
          {
            include: {
              // @ts-expect-error - Testing runtime validation
              posts: { orderBy: { createdAt: 'desc' } },
            },
          },
        ]),
      ).toThrow(Error);
    });
  });

  describe('edge cases', () => {
    it('should handle queries with only empty objects', () => {
      const result = mergePrismaQueries([{}, {}, {}]);
      expect(result).toEqual({ include: {} });
    });

    it('should handle queries with undefined include', () => {
      const result = mergePrismaQueries([
        { include: undefined },
        { include: { profile: true } },
        { include: undefined },
      ]);
      expect(result).toEqual({ include: { profile: true } });
    });

    it('should handle single query with nested empty include', () => {
      const result = mergePrismaQueries([{ include: { posts: true } }]);
      expect(result).toEqual({ include: { posts: true } });
    });

    it('should handle merging where one side has no nested include', () => {
      const result = mergePrismaQueries([
        { include: { posts: { include: { comments: true } } } },
        { include: { posts: {} } },
      ]);
      expect(result).toEqual({
        include: { posts: { include: { comments: true } } },
      });
    });
  });
});
