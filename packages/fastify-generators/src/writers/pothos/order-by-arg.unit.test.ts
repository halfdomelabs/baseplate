import { tsCodeFragment } from '@baseplate-dev/core-generators';
import { describe, expect, it } from 'vitest';

import { buildOrderByValueFragment } from './order-by-arg.js';

const applyStableOrderByFragment = tsCodeFragment('applyStableOrderBy');

/**
 * Renders a fragment's contents for assertion. Fragments are emitted
 * unformatted (Prettier runs later in the pipeline), so whitespace and
 * trailing commas are normalised away to keep expectations readable.
 */
function render(
  fragment: ReturnType<typeof buildOrderByValueFragment>,
): string | undefined {
  return fragment?.contents
    .replaceAll(/\s+/g, ' ')
    .replaceAll(',}', ' }')
    .replaceAll('{', '{ ')
    .replaceAll(/\s+/g, ' ')
    .trim();
}

describe('buildOrderByValueFragment', () => {
  describe('when the surface exposes an orderBy argument', () => {
    it('passes the caller sort and ID tiebreaker to the helper', () => {
      expect(
        render(
          buildOrderByValueFragment({
            argExpression: 'args.orderBy',
            applyStableOrderByFragment,
            idFieldNames: ['id'],
            defaultSort: [],
          }),
        ),
      ).toBe('applyStableOrderBy(args.orderBy, ["id"]) ?? undefined');
    });

    it('passes the default sort as the third argument', () => {
      expect(
        render(
          buildOrderByValueFragment({
            argExpression: 'args.orderBy',
            applyStableOrderByFragment,
            idFieldNames: ['id'],
            defaultSort: [{ fieldName: 'position', direction: 'asc' }],
          }),
        ),
      ).toBe(
        `applyStableOrderBy(args.orderBy, ["id"], [{ position: 'asc' }]) ?? undefined`,
      );
    });

    it('preserves multi-key default order', () => {
      expect(
        render(
          buildOrderByValueFragment({
            argExpression: 'orderBy',
            applyStableOrderByFragment,
            idFieldNames: ['id'],
            defaultSort: [
              { fieldName: 'position', direction: 'asc' },
              { fieldName: 'createdAt', direction: 'desc' },
            ],
          }),
        ),
      ).toBe(
        `applyStableOrderBy(orderBy, ["id"], [{ position: 'asc' }, { createdAt: 'desc' }]) ?? undefined`,
      );
    });
  });

  describe('when the surface exposes no orderBy argument', () => {
    it('returns undefined with no default sort', () => {
      expect(
        buildOrderByValueFragment({
          applyStableOrderByFragment,
          idFieldNames: ['id'],
          defaultSort: [],
        }),
      ).toBeUndefined();
    });

    it('emits a static literal with the ID tiebreaker appended', () => {
      expect(
        render(
          buildOrderByValueFragment({
            idFieldNames: ['id'],
            defaultSort: [{ fieldName: 'position', direction: 'asc' }],
          }),
        ),
      ).toBe(`[{ position: 'asc' }, { id: 'asc' }]`);
    });

    it('does not duplicate an ID field the default already sorts on', () => {
      expect(
        render(
          buildOrderByValueFragment({
            idFieldNames: ['id'],
            defaultSort: [{ fieldName: 'id', direction: 'desc' }],
          }),
        ),
      ).toBe(`[{ id: 'desc' }]`);
    });

    it('appends every composite ID field not already sorted on', () => {
      expect(
        render(
          buildOrderByValueFragment({
            idFieldNames: ['tenantId', 'id'],
            defaultSort: [{ fieldName: 'tenantId', direction: 'desc' }],
          }),
        ),
      ).toBe(`[{ tenantId: 'desc' }, { id: 'asc' }]`);
    });

    it('emits a literal even when the sort order helper is unavailable', () => {
      expect(
        render(
          buildOrderByValueFragment({
            idFieldNames: ['id'],
            defaultSort: [{ fieldName: 'createdAt', direction: 'desc' }],
          }),
        ),
      ).toBe(`[{ createdAt: 'desc' }, { id: 'asc' }]`);
    });
  });
});
