// @ts-nocheck

// AUTH_LINK:START
const authLink = setContext(async () => {
  const isAuthenticated = authService.isAuthenticated();
  if (!isAuthenticated) {
    return {};
  }
  const accessToken = await authService.getAccessToken();
  return {
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
  };
});
// AUTH_LINK:END

// REFRESH_TOKEN_LINK:START
const refreshTokenLink = onError(({ networkError, operation, forward }) => {
  const networkServerError = networkError as ServerError;
  if (networkServerError?.statusCode === 401 && authService.isAuthenticated()) {
    authService.invalidateAccessToken();
    return forward(operation);
  }
  return undefined;
});
// REFRESH_TOKEN_LINK:END
