---
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-common': patch
'@baseplate-dev/plugin-auth': patch
---

Add rate limiting plugin for Baseplate projects

This release introduces a new rate limiting plugin that provides:

- **Rate Limiting Service**: `createRateLimiter` and `memoizeRateLimiter` functions for flexible rate limiting
- **Prisma/PostgreSQL Backend**: Uses `rate-limiter-flexible` with Prisma storage
- **TooManyRequestsError**: New HTTP error class with `Retry-After` header support in error-handler-service
- **Model Merger**: Automatically creates the `RateLimiterFlexible` model via the project builder UI
- **Type-Safe API**: Full TypeScript support for rate limiter configuration and results

The auth plugin now supports rate limiting for login attempts via the rate-limit plugin integration.
