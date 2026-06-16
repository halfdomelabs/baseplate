---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-web': patch
---

Re-introduce GraphQL subscriptions support, now transported over Server-Sent
Events (SSE) instead of WebSockets (ENG-1088).
