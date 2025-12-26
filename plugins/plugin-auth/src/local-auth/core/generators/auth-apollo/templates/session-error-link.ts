// @ts-nocheck

// SESSION_ERROR_LINK:START
const sessionErrorLink = new ErrorLink(({ error }) => {
  if (ServerError.is(error) && error.statusCode === 401) {
    // Try to parse the body as JSON to check for invalid-session
    try {
      const body = JSON.parse(error.bodyText) as { code?: string };
      if (body.code === 'invalid-session') {
        userSessionClient.signOut();
      }
    } catch {
      // Body is not JSON, ignore
    }
  }
  return;
});
// SESSION_ERROR_LINK:END
