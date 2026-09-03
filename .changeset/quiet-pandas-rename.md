---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-payments': patch
---

The auth hook that returns the signed-in user id is now consistently `useUserIdOrThrow` in `use-user-id-or-throw.ts` across Better Auth, local auth and placeholder auth, following Prisma's `OrThrow` naming; Better Auth apps should rename their imports of `useRequiredUserId`. Import maps for auth context, password reset and Stripe billing no longer offer symbols that the generated files stopped exporting.
