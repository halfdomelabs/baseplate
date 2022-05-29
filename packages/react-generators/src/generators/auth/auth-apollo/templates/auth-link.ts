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
const refreshTokenLink = onError(
  ({ graphQLErrors, networkError, operation, forward }) => {
    const hasInvalidTokenError = graphQLErrors?.some((error) => {
      const { extensions } = error;
      const errorExtensions: ErrorExtensions | undefined = extensions;
      return (
        errorExtensions?.code === 'invalid-token' ||
        errorExtensions?.code === 'token-expired'
      );
    });
    if (
      ((networkError as ServerError)?.statusCode === 401 ||
        hasInvalidTokenError) &&
      authService.isAuthenticated()
    ) {
      authService.invalidateAccessToken();
      return forward(operation);
    }
    return undefined;
  }
);
// REFRESH_TOKEN_LINK:END
