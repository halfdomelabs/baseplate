// do not need a file for each class
/* eslint-disable max-classes-per-file */

export class HttpError extends Error {
  constructor(
    message: string,
    public code?: string,
    public extraData?: Record<string, unknown>,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message: string,
    code = 'BAD_REQUEST',
    extraData?: Record<string, unknown>
  ) {
    super(message, code, extraData, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    message: string,
    code = 'UNAUTHORIZED',
    extraData?: Record<string, unknown>
  ) {
    super(message, code, extraData, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message: string,
    code = 'FORBIDDEN',
    extraData?: Record<string, unknown>
  ) {
    super(message, code, extraData, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(
    message: string,
    code = 'NOT_FOUND',
    extraData?: Record<string, unknown>
  ) {
    super(message, code, extraData, 404);
  }
}

export class InternalServerError extends HttpError {
  constructor(
    message: string,
    code = 'INTERNAL_SERVER_ERROR',
    extraData?: Record<string, unknown>
  ) {
    super(message, code, extraData, 500);
  }
}
