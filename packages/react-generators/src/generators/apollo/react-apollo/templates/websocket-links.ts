// @ts-nocheck

// GET_WS_URL:START
function getWsUrl(): string {
  // handle case where API endpoint includes domain, e.g. http://localhost/api/graphql
  if (config.REACT_APP_GRAPH_API_ENDPOINT.includes('http')) {
    return config.REACT_APP_GRAPH_API_ENDPOINT.replace(
      'https://',
      'wss://'
    ).replace('http://', 'ws://');
  }
  // handle relative API endpoint, e.g. /api/graphql
  const { protocol, host } = window.location;
  const wsProtocol = protocol === 'https:' ? 'wss:' : 'ws:';
  return `${wsProtocol}//${host}${config.REACT_APP_GRAPH_API_ENDPOINT}`;
}
// GET_WS_URL:END

// SPLIT_LINK:START
const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    );
  },
  WS_LINK,
  HTTP_LINK
);
// SPLIT_LINK:END

// RETRY_WAIT:START
async (retries) => {
  await new Promise((resolve) => {
    // use exponential backoff strategy capped at 30 seconds
    const cappedExponentialBackoff = Math.min(2 ** retries * 1000, 30 * 1000);
    // insert a bit of randomness to prevent thundering herd problem
    const randomDelay = Math.random() * 3000;
    setTimeout(resolve, cappedExponentialBackoff + randomDelay);
  });
};
// RETRY_WAIT:END
