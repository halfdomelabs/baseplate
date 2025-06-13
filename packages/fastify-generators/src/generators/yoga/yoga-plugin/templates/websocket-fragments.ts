// @ts-nocheck

// ON_CONNECT:START
onConnect: async (ctx) => {
  try {
    // attach auth info to request
    const authorizationHeader = ctx.connectionParams?.authorization;
    const sessionInfo = TPL_SESSION_INFO_CREATOR;
    ctx.extra.request.auth = createAuthContextFromSessionInfo(sessionInfo);

    // set expiry for socket based on auth token expiry
    const tokenExpiry = sessionInfo?.expiresAt;
    if (tokenExpiry) {
      const { socket } = ctx.extra;

      const timeoutHandle = setTimeout(() => {
        try {
          socket.close(CloseCode.Forbidden, 'token-expired');
        } catch (err) {
          logError(err);
        }
      }, tokenExpiry.getTime() - Date.now());
      socket.on('close', () => {
        clearTimeout(timeoutHandle);
      });
    }
  } catch (err) {
    // only a subset of HTTP errors are mapped
    const httpToSocketErrorMap: Partial<Record<number, CloseCode>> = {
      403: CloseCode.Forbidden,
      // due to implementation of graphql-ws, only Forbidden will be retried
      // https://github.com/enisdenjo/graphql-ws/blob/master/src/client.ts#L827
      401: CloseCode.Forbidden,
      400: CloseCode.BadRequest,
    };
    logger.error(
      `websocket connection failed: ${
        err instanceof Error ? err.message : typeof err
      }`,
    );
    if (err instanceof HttpError && httpToSocketErrorMap[err.statusCode]) {
      ctx.extra.socket.close(httpToSocketErrorMap[err.statusCode], err.code);
    } else {
      logError(err);
      ctx.extra.socket.close(CloseCode.InternalServerError, 'unknown-error');
    }
  }
};
// ON_CONNECT:END
