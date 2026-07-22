import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  getApolloErrorCode,
  getApolloErrorData,
  getApolloErrorDetails,
} from './apollo-error.js';

const CODES = ['INVALID_FILE_TYPE', 'FILE_SIZE_TOO_LARGE'] as const;

function makeError(
  code: string,
  extraData?: Record<string, unknown>,
): CombinedGraphQLErrors {
  return new CombinedGraphQLErrors({
    errors: [{ message: 'Server message', extensions: { code, extraData } }],
  });
}

describe('getApolloErrorDetails', () => {
  it('returns the code and structured data for a matching error', () => {
    const error = makeError('INVALID_FILE_TYPE', {
      allowedMimeTypes: ['image/png'],
    });
    expect(getApolloErrorDetails(error, CODES)).toEqual({
      code: 'INVALID_FILE_TYPE',
      data: { allowedMimeTypes: ['image/png'] },
    });
  });

  it('returns null when no allowed code matches', () => {
    const error = makeError('SOME_OTHER_CODE');
    expect(getApolloErrorDetails(error, CODES)).toBeNull();
  });

  it('returns null for a non-Apollo error', () => {
    expect(getApolloErrorDetails(new Error('boom'), CODES)).toBeNull();
  });

  it('returns undefined data when the server omits extraData', () => {
    const error = makeError('INVALID_FILE_TYPE');
    expect(getApolloErrorDetails(error, CODES)).toEqual({
      code: 'INVALID_FILE_TYPE',
      data: undefined,
    });
  });

  it('does not assert the shape of extraData', () => {
    // A malformed payload is returned as-is so callers can validate it; it must
    // not throw here.
    const error = makeError('INVALID_FILE_TYPE', {
      allowedMimeTypes: 'not-an-array',
    });
    expect(getApolloErrorDetails(error, CODES)?.data).toEqual({
      allowedMimeTypes: 'not-an-array',
    });
  });
});

describe('getApolloErrorCode', () => {
  it('returns the matched code', () => {
    const error = makeError('FILE_SIZE_TOO_LARGE', { maxFileSize: 1000 });
    expect(getApolloErrorCode(error, CODES)).toBe('FILE_SIZE_TOO_LARGE');
  });

  it('returns null when no allowed code matches', () => {
    expect(getApolloErrorCode(makeError('NOPE'), CODES)).toBeNull();
  });
});

describe('getApolloErrorData', () => {
  const SCHEMAS = {
    INVALID_FILE_TYPE: z.object({
      allowedFileExtensions: z.array(z.string()).optional(),
    }),
    FILE_SIZE_TOO_LARGE: z.object({ maxFileSize: z.number().optional() }),
  };

  it('returns the matched code with its parsed, typed data', () => {
    const error = makeError('INVALID_FILE_TYPE', {
      allowedFileExtensions: ['jpg', 'png'],
    });
    expect(getApolloErrorData(error, SCHEMAS)).toEqual({
      code: 'INVALID_FILE_TYPE',
      data: { allowedFileExtensions: ['jpg', 'png'] },
    });
  });

  it('parses to an empty object when the server omits extraData', () => {
    const error = makeError('FILE_SIZE_TOO_LARGE');
    expect(getApolloErrorData(error, SCHEMAS)).toEqual({
      code: 'FILE_SIZE_TOO_LARGE',
      data: {},
    });
  });

  it('yields undefined data when the payload fails its schema, without throwing', () => {
    const error = makeError('FILE_SIZE_TOO_LARGE', { maxFileSize: 'huge' });
    expect(getApolloErrorData(error, SCHEMAS)).toEqual({
      code: 'FILE_SIZE_TOO_LARGE',
      data: undefined,
    });
  });

  it('returns null when no schema code matches', () => {
    expect(getApolloErrorData(makeError('NOPE'), SCHEMAS)).toBeNull();
  });

  it('returns null for a non-Apollo error', () => {
    expect(getApolloErrorData(new Error('boom'), SCHEMAS)).toBeNull();
  });
});
