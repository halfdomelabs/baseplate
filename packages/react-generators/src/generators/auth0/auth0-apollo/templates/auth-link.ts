// @ts-nocheck

// AUTH_LINK:START
const authLink = setContext(async () => {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return {};
  }
  return { headers: { authorization: `Bearer ${accessToken}` } };
});
// AUTH_LINK:END
