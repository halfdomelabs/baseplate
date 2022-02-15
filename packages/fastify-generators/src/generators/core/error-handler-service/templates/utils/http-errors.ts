// do not need a file for each class
/* eslint-disable max-classes-per-file */

export class HttpError extends Error {
  constructor(
    message: string,
    public errorCode?: string,
    public extraData?: Record<string, unknown>,
    public statusCode: number = 500
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message: string,
    errorCode = 'BAD_REQUEST',
    extraData?: Record<string, unknown>
  ) {
    super(message, errorCode, extraData, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    message: string,
    errorCode = 'UNAUTHORIZED',
    extraData?: Record<string, unknown>
  ) {
    super(message, errorCode, extraData, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message: string,
    errorCode = 'FORBIDDEN',
    extraData?: Record<string, unknown>
  ) {
    super(message, errorCode, extraData, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(
    message: string,
    errorCode = 'NOT_FOUND',
    extraData?: Record<string, unknown>
  ) {
    super(message, errorCode, extraData, 404);
  }
}

export class InternalServerError extends HttpError {
  constructor(
    message: string,
    errorCode = 'INTERNAL_SERVER_ERROR',
    extraData?: Record<string, unknown>
  ) {
    super(message, errorCode, extraData, 500);
  }
}
