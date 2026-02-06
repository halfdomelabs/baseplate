---
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-common': patch
---

Add rate limiting plugin for Baseplate projects

This release introduces a new rate limiting plugin that provides:

- **Rate Limiting Service**: `createRateLimiter` and `memoizeRateLimiter` functions for flexible rate limiting
- **Prisma/PostgreSQL Backend**: Uses `rate-limiter-flexible` with Prisma storage
- **TooManyRequestsError**: New HTTP error class with `Retry-After` header support
- **Type-Safe API**: Full TypeScript support for rate limiter configuration and results

The plugin requires a `RateLimiterFlexible` Prisma model to be defined in your project:

```prisma
model RateLimiterFlexible {
  key     String   @id
  points  Int
  expire  DateTime?
}
```
