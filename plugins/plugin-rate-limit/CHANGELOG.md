# @baseplate-dev/plugin-rate-limit

## 0.1.3

### Patch Changes

- Updated dependencies [[`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704)]:
  - @baseplate-dev/project-builder-lib@0.5.4
  - @baseplate-dev/fastify-generators@0.5.4
  - @baseplate-dev/core-generators@0.5.4
  - @baseplate-dev/sync@0.5.4
  - @baseplate-dev/ui-components@0.5.4
  - @baseplate-dev/utils@0.5.4

## 0.1.2

### Patch Changes

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/fastify-generators@0.5.3
  - @baseplate-dev/project-builder-lib@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 0.1.1

### Patch Changes

- [#749](https://github.com/halfdomelabs/baseplate/pull/749) [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e) Thanks [@kingston](https://github.com/kingston)! - Add rate limiting plugin for Baseplate projects

  This release introduces a new rate limiting plugin that provides:
  - **Rate Limiting Service**: `createRateLimiter` and `memoizeRateLimiter` functions for flexible rate limiting
  - **Prisma/PostgreSQL Backend**: Uses `rate-limiter-flexible` with Prisma storage
  - **TooManyRequestsError**: New HTTP error class with `Retry-After` header support in error-handler-service
  - **Model Merger**: Automatically creates the `RateLimiterFlexible` model via the project builder UI
  - **Type-Safe API**: Full TypeScript support for rate limiter configuration and results

  The auth plugin now supports rate limiting for login attempts via the rate-limit plugin integration.

- [#756](https://github.com/halfdomelabs/baseplate/pull/756) [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities and update to latest versions

  **Security fixes:**
  - @modelcontextprotocol/sdk: 1.25.1 → 1.26.0 (fixes CVE-2026-25536 - cross-client data leak)
  - fastify: 5.6.2 → 5.7.4 (security patches)
  - diff: 8.0.2 → 8.0.3 (fixes CVE-2026-24001 - DoS vulnerability)
  - testcontainers: 11.10.0 → 11.11.0 (fixes undici vulnerability)

  **Package updates (monorepo):**
  - @tailwindcss/vite: 4.1.13 → 4.1.18
  - tailwindcss: 4.1.13 → 4.1.18
  - @tanstack/react-router: 1.139.7 → 1.159.5
  - @tanstack/router-plugin: 1.139.7 → 1.159.5
  - @testing-library/jest-dom: 6.6.3 → 6.9.1
  - concurrently: 9.0.1 → 9.2.1
  - ts-morph: 26.0.0 → 27.0.2

  **Package updates (generated projects):**
  - prisma/@prisma/client/@prisma/adapter-pg: 7.2.0 → 7.4.0
  - postmark: 4.0.2 → 4.0.5
  - axios: 1.12.0 → 1.13.5

- Updated dependencies [[`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948), [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e), [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/fastify-generators@0.5.2
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2
