# @baseplate-dev/plugin-rate-limit

Rate limiting plugin for Baseplate.

Provides flexible rate limiting for your application using Prisma-backed storage with `rate-limiter-flexible`.

## Features

- Configurable rate limits (points, duration, block duration)
- Prisma/PostgreSQL storage backend
- Memoized rate limiter instances
- Built-in `TooManyRequestsError` with `Retry-After` header support
- Type-safe API

## Usage

After enabling the plugin in your project, you can create and use rate limiters:

```typescript
import { createRateLimiter, memoizeRateLimiter } from '@src/services/rate-limiter.service.js';

// Create a rate limiter directly
const limiter = createRateLimiter({
  points: 5,
  duration: 60, // 60 seconds
  blockDuration: 300, // Block for 5 minutes after limit exceeded
  keyPrefix: 'login',
});

// Or use memoization for singleton instances
const getLoginLimiter = memoizeRateLimiter(() => ({
  points: 5,
  duration: 60,
  blockDuration: 300,
  keyPrefix: 'login',
}));

// Use the limiter
const result = await limiter.consume(userIp);
if (!result.allowed) {
  // Handle rate limited request
}

// Or throw on rate limit
await limiter.consumeOrThrow(
  userIp,
  'Too many login attempts',
  'LOGIN_RATE_LIMITED'
);
```

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and extends Baseplate projects with rate limiting functionality.
