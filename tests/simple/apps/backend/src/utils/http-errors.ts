export class HttpError extends Error {
  constructor(
    message: string,
    public code?: string,
    public extraData?: Record<string, unknown>,
    public statusCode = 500,
    public headers?: Record<string, string>,
  ) {
    super(message);
  }
}

export class BadRequestError extends HttpError {
  constructor(
    message: string,
    code = 'BAD_REQUEST',
    extraData?: Record<string, unknown>,
  ) {
    super(message, code, extraData, 400);
  }
}

export class UnauthorizedError extends HttpError {
  constructor(
    message: string,
    code = 'UNAUTHORIZED',
    extraData?: Record<string, unknown>,
  ) {
    super(message, code, extraData, 401);
  }
}

export class ForbiddenError extends HttpError {
  constructor(
    message: string,
    code = 'FORBIDDEN',
    extraData?: Record<string, unknown>,
  ) {
    super(message, code, extraData, 403);
  }
}

export class NotFoundError extends HttpError {
  constructor(
    message: string,
    code = 'NOT_FOUND',
    extraData?: Record<string, unknown>,
  ) {
    super(message, code, extraData, 404);
  }
}

export class TooManyRequestsError extends HttpError {
  constructor(
    message: string,
    code = 'TOO_MANY_REQUESTS',
    extraData?: Record<string, unknown>,
  ) {
    const retryAfterMs = extraData?.retryAfterMs;
    const headers =
      typeof retryAfterMs === 'number'
        ? { 'Retry-After': String(Math.ceil(retryAfterMs / 1000)) }
        : undefined;
    super(message, code, extraData, 429, headers);
  }
}

export class InternalServerError extends HttpError {
  constructor(
    message: string,
    code = 'INTERNAL_SERVER_ERROR',
    extraData?: Record<string, unknown>,
  ) {
    super(message, code, extraData, 500);
  }
}
