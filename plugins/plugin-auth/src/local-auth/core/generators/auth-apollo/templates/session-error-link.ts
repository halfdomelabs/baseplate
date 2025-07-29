// @ts-nocheck

// SESSION_ERROR_LINK:START
const sessionErrorLink = onError(({ networkError }) => {
  const serverError = networkError as ServerError | undefined;
  if (
    typeof serverError === 'object' &&
    serverError.statusCode === 401 &&
    typeof serverError.result === 'object' &&
    serverError.result.code === 'invalid-session'
  ) {
    userSessionClient.signOut();
  }
  return;
});
// SESSION_ERROR_LINK:END
