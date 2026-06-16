---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-web': patch
---

Re-introduce GraphQL subscriptions support, now transported over Server-Sent
Events (SSE) instead of WebSockets (ENG-1088).

- Backend (Fastify + GraphQL Yoga): subscriptions are served over Yoga's
  built-in SSE handler on the existing `/graphql` route. Removes the
  hand-maintained `graphql-ws` WebSocket adapter, the `@fastify/websocket`
  plugin, and the `graphql-ws`/`@fastify/websocket`/`@types/ws` dependencies.
  Subscription auth now rides the normal request (cookie/session) instead of a
  bespoke `connectionParams` handshake. Yoga is disposed on server shutdown so
  long-lived SSE connections don't block graceful close.
- Frontend (Apollo Client): adds a custom SSE link over `graphql-sse`
  (`apollo-sse-link.ts`) routed via the existing split link; replaces the
  `graphql-ws` link. The Vite dev proxy is configured to forward upstream
  connection closes for streaming responses so subscriptions reconnect after a
  backend restart (works around vitejs/vite#20712).
- Re-exposes the "GraphQL Subscriptions" toggle in the backend and web app
  configuration forms.
- Bumps the generated `@apollo/client` from 4.0.11 to 4.2.0.
