---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-storage': patch
---

Upgrade Apollo Client to v4

- @apollo/client: 3.13.8 → 4.0.11
- Add rxjs 7.8.2 as peer dependency (required by Apollo Client v4)

Breaking changes in generated code:

- React hooks (useQuery, useMutation, useApolloClient, etc.) now import from `@apollo/client/react` instead of `@apollo/client`
- ApolloProvider now imports from `@apollo/client/react`
- Error handling uses new `CombinedGraphQLErrors` and `ServerError` classes from `@apollo/client/errors`
- `ErrorLink` class replaces deprecated `onError` function
- `ApolloClient` is no longer generic (use `ApolloClient` instead of `ApolloClient<NormalizedCacheObject>`)
