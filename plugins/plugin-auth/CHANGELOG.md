# @baseplate-dev/plugin-auth

## 4.0.4

### Patch Changes

- [#778](https://github.com/halfdomelabs/baseplate/pull/778) [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities
  - @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner: 3.990.0 → 3.995.0 (fixes fast-xml-parser CVE-2025-69873 critical, CVE DoS high)
  - postmark: 4.0.5 → 4.0.7 (fixes axios DoS vulnerability)
  - fastify-auth0-verify: 3.0.0 → 4.1.0 (updates @fastify/jwt to v10)

- [#785](https://github.com/halfdomelabs/baseplate/pull/785) [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704) Thanks [@kingston](https://github.com/kingston)! - Remove redundant `.optional()` wrapper from `withDefault`

  `withDefault` previously wrapped the schema in both `.prefault()` and `.optional()`. Since `.prefault()` already makes fields accept absent/undefined input, the `.optional()` was redundant and caused the output type to incorrectly include `| undefined` for defaulted fields.

- Updated dependencies [[`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`634f6c5`](https://github.com/halfdomelabs/baseplate/commit/634f6c5aaffab982a985be9f85062de9d1e8a99b), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704)]:
  - @baseplate-dev/project-builder-lib@0.5.4
  - @baseplate-dev/fastify-generators@0.5.4
  - @baseplate-dev/plugin-email@0.1.4
  - @baseplate-dev/react-generators@0.5.4
  - @baseplate-dev/plugin-queue@2.0.4
  - @baseplate-dev/plugin-rate-limit@0.1.3
  - @baseplate-dev/core-generators@0.5.4
  - @baseplate-dev/sync@0.5.4
  - @baseplate-dev/ui-components@0.5.4
  - @baseplate-dev/utils@0.5.4

## 4.0.3

### Patch Changes

- [#769](https://github.com/halfdomelabs/baseplate/pull/769) [`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504) Thanks [@kingston](https://github.com/kingston)! - Fix hard-coded email template imports in auth plugin

- [#772](https://github.com/halfdomelabs/baseplate/pull/772) [`820a17f`](https://github.com/halfdomelabs/baseplate/commit/820a17f236e90b4c56c27710bba722153c1daa1a) Thanks [@kingston](https://github.com/kingston)! - Move auth-verification service to accounts level and add cleanup queue
  - Moved `auth-verification.service.ts` from `accounts/password/services/` to `accounts/services/` since it implements a generic split-token pattern that can be reused across different authentication types
  - Transferred template ownership from `auth-email-password` generator to `auth-module` generator for better architectural alignment
  - Added `cleanup-auth-verification.queue.ts` that runs hourly (at minute 15) to automatically delete expired auth verification tokens
  - Added `@baseplate-dev/plugin-queue` as a dependency for queue integration

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/plugin-email@0.1.3
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/fastify-generators@0.5.3
  - @baseplate-dev/react-generators@0.5.3
  - @baseplate-dev/plugin-queue@2.0.3
  - @baseplate-dev/plugin-rate-limit@0.1.2
  - @baseplate-dev/project-builder-lib@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 4.0.2

### Patch Changes

- [#761](https://github.com/halfdomelabs/baseplate/pull/761) [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497) Thanks [@kingston](https://github.com/kingston)! - Add configurable development ports for apps with automatic assignment and conflict validation

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add emailTemplateSpec for cross-plugin email template registration

  Introduces `emailTemplateSpec` in plugin-email, allowing other plugins to register email template generators with the transactional library compilation process. The auth plugin now uses this spec to register password-reset, password-changed, and account-verification email templates as proper generators instead of using snapshots. Also exports `emailTemplatesProvider` and adds component project exports to enable cross-generator template imports.

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add email verification flow and security hardening
  - **Backend**: Split-token auth verification service (`auth-verification.service.ts`) with constant-time comparison, SHA-256 hashed verifiers, and automatic cleanup
  - **Backend**: Email verification service with rate limiting (per-user: 3/20min, per-IP: 10/hr for both request and verify endpoints)
  - **Backend**: Email verification GraphQL mutations (`requestEmailVerification`, `verifyEmail`)
  - **Backend**: Anti-enumeration: unified `invalid-credentials` error for login (prevents email/password oracle)
  - **Frontend**: Email verification page with auto-verify, resend, and status states
  - **Frontend**: Updated login error handling for unified credential errors

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add password reset flow
  - **Backend**: Password reset service with secure token generation (SHA-256 hashed, single-use, 1-hour expiry), rate limiting (per-IP, per-email, global), and session invalidation on reset
  - **Backend**: GraphQL mutations for requesting reset, validating tokens, and completing reset
  - **Backend**: `AUTH_FRONTEND_URL` config field for constructing reset email links
  - **Frontend**: Forgot password and reset password pages with proper error handling
  - **Frontend**: Shared auth constants file for password validation limits
  - **Email**: Password changed confirmation email template
  - **Email**: Added `sendEmail` as a project export from the email module

- [#749](https://github.com/halfdomelabs/baseplate/pull/749) [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e) Thanks [@kingston](https://github.com/kingston)! - Add rate limiting plugin for Baseplate projects

  This release introduces a new rate limiting plugin that provides:
  - **Rate Limiting Service**: `createRateLimiter` and `memoizeRateLimiter` functions for flexible rate limiting
  - **Prisma/PostgreSQL Backend**: Uses `rate-limiter-flexible` with Prisma storage
  - **TooManyRequestsError**: New HTTP error class with `Retry-After` header support in error-handler-service
  - **Model Merger**: Automatically creates the `RateLimiterFlexible` model via the project builder UI
  - **Type-Safe API**: Full TypeScript support for rate limiter configuration and results

  The auth plugin now supports rate limiting for login attempts via the rate-limit plugin integration.

- [#755](https://github.com/halfdomelabs/baseplate/pull/755) [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b) Thanks [@kingston](https://github.com/kingston)! - Upgrade linting packages

  **Major version bumps:**
  - eslint: 9.32.0 → 9.39.2
  - @eslint/js: 9.32.0 → 9.39.2
  - eslint-plugin-perfectionist: 4.15.0 → 5.4.0
  - eslint-plugin-react-hooks: 5.2.0 → 7.0.1
  - eslint-plugin-unicorn: 60.0.0 → 62.0.0
  - globals: 16.4.0 → 17.3.0
  - prettier-plugin-packagejson: 2.5.19 → 3.0.0
  - storybook: 10.1.10 → 10.2.8

  **Minor/patch bumps:**
  - @vitest/eslint-plugin: 1.3.4 → 1.6.6 (tools), 1.6.5 → 1.6.6 (core-generators)
  - eslint-plugin-storybook: 10.1.10 → 10.2.3
  - prettier-plugin-tailwindcss: 0.6.14 → 0.7.2
  - typescript-eslint: 8.38.0 → 8.54.0
  - @types/eslint-plugin-jsx-a11y: 6.10.0 → 6.10.1

  **Config changes:**
  - Updated eslint-plugin-react-hooks v7 API: `configs['recommended-latest']` → `configs.flat['recommended-latest']`
  - Disabled new strict rules from react-hooks v7 (refs, set-state-in-effect, preserve-manual-memoization, incompatible-library)

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

- Updated dependencies [[`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948), [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3), [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3), [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e), [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/fastify-generators@0.5.2
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/react-generators@0.5.2
  - @baseplate-dev/plugin-email@0.1.2
  - @baseplate-dev/plugin-rate-limit@0.1.1
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/utils@0.5.2

## 4.0.1

### Patch Changes

- [#737](https://github.com/halfdomelabs/baseplate/pull/737) [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499) Thanks [@kingston](https://github.com/kingston)! - Refactor plugin spec system with lazy initialization and clear setup/use phases

  This refactoring overhauls the plugin spec system to introduce a two-phase architecture with lazy initialization:

  **New Architecture:**
  - **Setup phase (init)**: Plugins register their implementations during module initialization using mutable field containers
  - **Use phase**: Consumers access registered items through a read-only interface, with lazy initialization on first access
  - **FieldMap-based specs**: New `createFieldMapSpec` helper provides type-safe containers (maps, arrays, named arrays, scalars) with automatic source tracking

  **Key changes:**
  - Rename `PluginImplementationStore` to `PluginSpecStore` with cached `use()` instances
  - Rename `createPlatformPluginExport` to `createPluginModule`
  - Add required `name` field to all plugin modules for unique identification
  - Convert all specs to use `createFieldMapSpec` with typed containers
  - Update all plugin modules to use new registration methods (`.add()`, `.set()`, `.push()`)
  - Introduce `ModuleContext` with `moduleKey` and `pluginKey` for better source tracking
  - Specs now define both `init` (mutable setup interface) and `use` (read-only consumption interface)

- Updated dependencies [[`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534), [`ecebd3b`](https://github.com/halfdomelabs/baseplate/commit/ecebd3bf50cfa2d2a62501e0be39c411b42bed25), [`ff4203e`](https://github.com/halfdomelabs/baseplate/commit/ff4203e45a057b25a0ded5ecb3e1c07f5c7108b4), [`1debcb8`](https://github.com/halfdomelabs/baseplate/commit/1debcb89807fafdd7415a659f4bebbad0d69f072), [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499), [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534)]:
  - @baseplate-dev/fastify-generators@0.5.1
  - @baseplate-dev/react-generators@0.5.1
  - @baseplate-dev/project-builder-lib@0.5.1
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/ui-components@0.5.1
  - @baseplate-dev/utils@0.5.1

## 4.0.0

### Patch Changes

- [#730](https://github.com/halfdomelabs/baseplate/pull/730) [`397018b`](https://github.com/halfdomelabs/baseplate/commit/397018b8c30949f75734369b58c67d7afcc424a9) Thanks [@kingston](https://github.com/kingston)! - Add support for viewer query type to get current user

- Updated dependencies [[`fbabdec`](https://github.com/halfdomelabs/baseplate/commit/fbabdecf6715c21799d1c224b3a2162ef1f49797), [`397018b`](https://github.com/halfdomelabs/baseplate/commit/397018b8c30949f75734369b58c67d7afcc424a9), [`9b31726`](https://github.com/halfdomelabs/baseplate/commit/9b31726ee0dce77dc7b16fa334eb597d86349599), [`97bd14e`](https://github.com/halfdomelabs/baseplate/commit/97bd14e381206b54e55c22264d1d406e83146146), [`d09175d`](https://github.com/halfdomelabs/baseplate/commit/d09175dc41d33fb0a818d53c2e2da899430a48cd), [`c7d373e`](https://github.com/halfdomelabs/baseplate/commit/c7d373ebaaeda2522515fdaeae0d37d0cd9ce7fe), [`2d5abd5`](https://github.com/halfdomelabs/baseplate/commit/2d5abd53fccfc2b15f8142fc796c5e4ea4c2f92a), [`8bfc742`](https://github.com/halfdomelabs/baseplate/commit/8bfc742b8a93393a5539babfd11b97a88ee9c39e)]:
  - @baseplate-dev/fastify-generators@0.5.0
  - @baseplate-dev/core-generators@0.5.0
  - @baseplate-dev/react-generators@0.5.0
  - @baseplate-dev/project-builder-lib@0.5.0
  - @baseplate-dev/sync@0.5.0
  - @baseplate-dev/ui-components@0.5.0
  - @baseplate-dev/utils@0.5.0

## 3.0.4

### Patch Changes

- Updated dependencies [[`ec2f1e9`](https://github.com/halfdomelabs/baseplate/commit/ec2f1e9716e84cd4a901c071eacf4971436962d9)]:
  - @baseplate-dev/fastify-generators@0.4.4
  - @baseplate-dev/core-generators@0.4.4
  - @baseplate-dev/project-builder-lib@0.4.4
  - @baseplate-dev/react-generators@0.4.4
  - @baseplate-dev/sync@0.4.4
  - @baseplate-dev/ui-components@0.4.4
  - @baseplate-dev/utils@0.4.4

## 3.0.3

### Patch Changes

- [#725](https://github.com/halfdomelabs/baseplate/pull/725) [`b26e6e9`](https://github.com/halfdomelabs/baseplate/commit/b26e6e99d60aa5682ef1846d78ba37a571472215) Thanks [@kingston](https://github.com/kingston)! - Add ALLOWED_ORIGINS environment variable for CSRF protection
  - Add optional `ALLOWED_ORIGINS` config field that accepts a comma-separated list of additional allowed origins
  - Enables use cases with hosting providers like Render that use rewrites where the host header doesn't match the origin header

- [#717](https://github.com/halfdomelabs/baseplate/pull/717) [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d) Thanks [@kingston](https://github.com/kingston)! - Upgrade Apollo Client to v4
  - @apollo/client: 3.13.8 → 4.0.11
  - Add rxjs 7.8.2 as peer dependency (required by Apollo Client v4)

  Breaking changes in generated code:
  - React hooks (useQuery, useMutation, useApolloClient, etc.) now import from `@apollo/client/react` instead of `@apollo/client`
  - ApolloProvider now imports from `@apollo/client/react`
  - Error handling uses new `CombinedGraphQLErrors` and `ServerError` classes from `@apollo/client/errors`
  - `ErrorLink` class replaces deprecated `onError` function
  - `ApolloClient` is no longer generic (use `ApolloClient` instead of `ApolloClient<NormalizedCacheObject>`)

- Updated dependencies [[`12d1e62`](https://github.com/halfdomelabs/baseplate/commit/12d1e625bc04256eeb2704faa3f36dfda00545f9), [`6e23a6f`](https://github.com/halfdomelabs/baseplate/commit/6e23a6f2ff99954eebcb78b450d0c18618aa0b54), [`f1bab33`](https://github.com/halfdomelabs/baseplate/commit/f1bab3310fa8c00c645a6d9aca0a6a757cb661f1), [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d), [`8622c4e`](https://github.com/halfdomelabs/baseplate/commit/8622c4e2b91788ad4a368c9f06f82a17ee1a29ed), [`83e4e7f`](https://github.com/halfdomelabs/baseplate/commit/83e4e7f60adf67480cebb4ff419c015ff282010d)]:
  - @baseplate-dev/fastify-generators@0.4.3
  - @baseplate-dev/react-generators@0.4.3
  - @baseplate-dev/core-generators@0.4.3
  - @baseplate-dev/project-builder-lib@0.4.3
  - @baseplate-dev/sync@0.4.3
  - @baseplate-dev/ui-components@0.4.3
  - @baseplate-dev/utils@0.4.3

## 3.0.2

### Patch Changes

- [#697](https://github.com/halfdomelabs/baseplate/pull/697) [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54) Thanks [@kingston](https://github.com/kingston)! - Ignore \*.map files from built output in package.json

- [#707](https://github.com/halfdomelabs/baseplate/pull/707) [`21a9613`](https://github.com/halfdomelabs/baseplate/commit/21a9613c8e6e3d020c6630910599ef25ae34e3f6) Thanks [@kingston](https://github.com/kingston)! - Fix user session provider not syncing when server session differs from cached client state

- Updated dependencies [[`bde61e3`](https://github.com/halfdomelabs/baseplate/commit/bde61e3e5dfc4d6d19c0d2a71491de4605cd2c20), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`795ee4c`](https://github.com/halfdomelabs/baseplate/commit/795ee4c18e7b393fb9247ced23a12de5e219ab15), [`6828918`](https://github.com/halfdomelabs/baseplate/commit/6828918121bb244fdc84758d28a87370cbc70992), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`5d4ae05`](https://github.com/halfdomelabs/baseplate/commit/5d4ae05b1781100ee21c5a60784f0107014bade4), [`11fa86f`](https://github.com/halfdomelabs/baseplate/commit/11fa86fb8e7a209175f132b1b3d59cd24cf13d54), [`74529e7`](https://github.com/halfdomelabs/baseplate/commit/74529e7fffae8a70f8cfe801a1897204d010e291), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`ae2aba1`](https://github.com/halfdomelabs/baseplate/commit/ae2aba1f31c35c306cc459e0efe5e3612ece5c94), [`2395821`](https://github.com/halfdomelabs/baseplate/commit/239582148fe92d80457a31021036fa1e2c51cf5d), [`4be6c7d`](https://github.com/halfdomelabs/baseplate/commit/4be6c7dc7d900c37585b93cf5bb7198de6a41f1f), [`18c7cf1`](https://github.com/halfdomelabs/baseplate/commit/18c7cf19c0d171b734eb9bcc53320ccf02baa08a), [`e8576b9`](https://github.com/halfdomelabs/baseplate/commit/e8576b9ba5912acf9d81bcc1b18a0fbc8df91220), [`a173074`](https://github.com/halfdomelabs/baseplate/commit/a1730748bbbc21ea22d9d91bf28e34d2c351425b), [`e426b52`](https://github.com/halfdomelabs/baseplate/commit/e426b52d37f04f71ca960eb4cad2246af0603bd3)]:
  - @baseplate-dev/project-builder-lib@0.4.2
  - @baseplate-dev/fastify-generators@0.4.2
  - @baseplate-dev/sync@0.4.2
  - @baseplate-dev/react-generators@0.4.2
  - @baseplate-dev/core-generators@0.4.2
  - @baseplate-dev/ui-components@0.4.2
  - @baseplate-dev/utils@0.4.2

## 3.0.1

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.4.1
  - @baseplate-dev/fastify-generators@0.4.1
  - @baseplate-dev/project-builder-lib@0.4.1
  - @baseplate-dev/react-generators@0.4.1
  - @baseplate-dev/sync@0.4.1
  - @baseplate-dev/ui-components@0.4.1
  - @baseplate-dev/utils@0.4.1

## 3.0.0

### Patch Changes

- Updated dependencies [[`9f22eef`](https://github.com/halfdomelabs/baseplate/commit/9f22eef139c8db2dde679f6424eb23e024e37d19), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5), [`e68624e`](https://github.com/halfdomelabs/baseplate/commit/e68624e9372480da767d220cae60d45d9ed3c636), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`839cbdf`](https://github.com/halfdomelabs/baseplate/commit/839cbdfc6ddc059aa86d24bf6ec5d8e95cce9042), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`852c3a5`](https://github.com/halfdomelabs/baseplate/commit/852c3a5ff3a185e60efaeb2cbb90eed59a95ec2b), [`c3c2a00`](https://github.com/halfdomelabs/baseplate/commit/c3c2a001d57a21f76e064af55941a43bedf26f18), [`6daff18`](https://github.com/halfdomelabs/baseplate/commit/6daff18a033d2d78746984edebba4d8c6fe957a5), [`a6274e9`](https://github.com/halfdomelabs/baseplate/commit/a6274e98e2f56cdac23e9ff2bc338946a569a65c), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`e79df28`](https://github.com/halfdomelabs/baseplate/commit/e79df28eb7ab0275da2f630edcb1243bee40b7a5), [`ac912b3`](https://github.com/halfdomelabs/baseplate/commit/ac912b384559f48c3603976d070eb54c9f20fb9b), [`d324059`](https://github.com/halfdomelabs/baseplate/commit/d3240594e1c2bc2348eb1a7e8938f97ea5f55d22), [`57e15c0`](https://github.com/halfdomelabs/baseplate/commit/57e15c085099508898756385661df9cf54108466)]:
  - @baseplate-dev/project-builder-lib@0.4.0
  - @baseplate-dev/fastify-generators@0.4.0
  - @baseplate-dev/sync@0.4.0
  - @baseplate-dev/core-generators@0.4.0
  - @baseplate-dev/utils@0.4.0
  - @baseplate-dev/react-generators@0.4.0
  - @baseplate-dev/ui-components@0.4.0

## 2.0.8

### Patch Changes

- [#669](https://github.com/halfdomelabs/baseplate/pull/669) [`81f4916`](https://github.com/halfdomelabs/baseplate/commit/81f4916d9ca8fed18653f3ec615de1e0a19a540b) Thanks [@kingston](https://github.com/kingston)! - Make sure we clear the cookie properly when session is invalid

- Updated dependencies [[`fc93dd7`](https://github.com/halfdomelabs/baseplate/commit/fc93dd70c182ac99d1f025745d88a32d6de733f5)]:
  - @baseplate-dev/fastify-generators@0.3.8
  - @baseplate-dev/core-generators@0.3.8
  - @baseplate-dev/project-builder-lib@0.3.8
  - @baseplate-dev/react-generators@0.3.8
  - @baseplate-dev/sync@0.3.8
  - @baseplate-dev/ui-components@0.3.8
  - @baseplate-dev/utils@0.3.8

## 2.0.7

### Patch Changes

- [#664](https://github.com/halfdomelabs/baseplate/pull/664) [`d6f70e0`](https://github.com/halfdomelabs/baseplate/commit/d6f70e03f539bd8687d9e9abfc0e7cef5c9e6e29) Thanks [@kingston](https://github.com/kingston)! - Fix cookie clearing by passing options to ensure secure cookies are properly cleared. The CookieStore interface now accepts optional CookieSerializeOptions when clearing cookies, and the auth module template now passes COOKIE_OPTIONS when clearing session cookies to maintain consistency with cookie creation.

- Updated dependencies [[`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d), [`d6f70e0`](https://github.com/halfdomelabs/baseplate/commit/d6f70e03f539bd8687d9e9abfc0e7cef5c9e6e29), [`9508a8e`](https://github.com/halfdomelabs/baseplate/commit/9508a8ee75e33ea0c0632f3f5ef5621b020f530d)]:
  - @baseplate-dev/core-generators@0.3.7
  - @baseplate-dev/fastify-generators@0.3.7
  - @baseplate-dev/react-generators@0.3.7
  - @baseplate-dev/project-builder-lib@0.3.7
  - @baseplate-dev/sync@0.3.7
  - @baseplate-dev/ui-components@0.3.7
  - @baseplate-dev/utils@0.3.7

## 2.0.6

### Patch Changes

- Updated dependencies [[`1186a21`](https://github.com/halfdomelabs/baseplate/commit/1186a21df267d112a84a42ff1d3c87b495452ce0), [`354b975`](https://github.com/halfdomelabs/baseplate/commit/354b9754e126f4e9f6f4cda0ac4e5f7ca15c0160)]:
  - @baseplate-dev/core-generators@0.3.6
  - @baseplate-dev/react-generators@0.3.6
  - @baseplate-dev/fastify-generators@0.3.6
  - @baseplate-dev/project-builder-lib@0.3.6
  - @baseplate-dev/sync@0.3.6
  - @baseplate-dev/ui-components@0.3.6
  - @baseplate-dev/utils@0.3.6

## 2.0.5

### Patch Changes

- [#656](https://github.com/halfdomelabs/baseplate/pull/656) [`6d0be95`](https://github.com/halfdomelabs/baseplate/commit/6d0be954ba866414fb673694a72e73ab433c7b12) Thanks [@kingston](https://github.com/kingston)! - Fix filtering of transformers for web UI

- Updated dependencies [[`6d0be95`](https://github.com/halfdomelabs/baseplate/commit/6d0be954ba866414fb673694a72e73ab433c7b12)]:
  - @baseplate-dev/react-generators@0.3.5
  - @baseplate-dev/core-generators@0.3.5
  - @baseplate-dev/fastify-generators@0.3.5
  - @baseplate-dev/project-builder-lib@0.3.5
  - @baseplate-dev/sync@0.3.5
  - @baseplate-dev/ui-components@0.3.5
  - @baseplate-dev/utils@0.3.5

## 2.0.4

### Patch Changes

- [#641](https://github.com/halfdomelabs/baseplate/pull/641) [`10423d3`](https://github.com/halfdomelabs/baseplate/commit/10423d33f5a2094eea75fb20744017908e9850bd) Thanks [@kingston](https://github.com/kingston)! - Require name field for the manage roles action

- [#638](https://github.com/halfdomelabs/baseplate/pull/638) [`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0) Thanks [@kingston](https://github.com/kingston)! - Standardize data model names across auth and storage plugins

  This change removes the ability for users to configure custom model names, replacing it with standardized, fixed model names extracted to plugin-specific constants files. This simplifies templates by eliminating parameterization and makes it easier to discover what models are used by each plugin.

  **Breaking Changes:**
  - Removed `modelRefs` configuration from plugin schemas
  - Model names are now fixed: User, UserAccount, UserRole, UserSession (auth), File (storage)

  **Improvements:**
  - Added plugin-specific constants files for better discoverability
  - Simplified UI by removing model selection components
  - Enhanced ModelMergerResultAlert to show "Models Up to Date" instead of null when no changes needed
  - Maintained type safety with Record types

  **Migration:**
  - Remove any `modelRefs` configuration from plugin definitions
  - Model names will be automatically standardized to the new constants

- [#640](https://github.com/halfdomelabs/baseplate/pull/640) [`f6dec7c`](https://github.com/halfdomelabs/baseplate/commit/f6dec7c2166d8ae01fd0ba62b464352b320de052) Thanks [@kingston](https://github.com/kingston)! - Only check for origin header if user session cookie is present

- [#643](https://github.com/halfdomelabs/baseplate/pull/643) [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a) Thanks [@kingston](https://github.com/kingston)! - Upgrade to TypeScript 5.8 with erasable syntax only mode

  This upgrade modernizes the codebase with TypeScript 5.8, enables erasable syntax only mode for better performance, and updates runtime dependencies.

  **Key Changes:**
  - Upgraded TypeScript to version 5.8
  - Enabled `erasableSyntaxOnly` compiler option for improved build performance
  - Updated Node.js requirement to 22.18
  - Updated PNPM requirement to 10.15
  - Fixed parameter property syntax to be compatible with erasable syntax only mode

- Updated dependencies [[`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`217de38`](https://github.com/halfdomelabs/baseplate/commit/217de385f3ac869c5ef740af32634db9bcab6b0c), [`67dba69`](https://github.com/halfdomelabs/baseplate/commit/67dba697439e6bc76b81522c133d920af4dbdbb1), [`f450b7f`](https://github.com/halfdomelabs/baseplate/commit/f450b7f75cf5ad71c2bdb1c077526251aa240dd0), [`7d9e6d0`](https://github.com/halfdomelabs/baseplate/commit/7d9e6d01e0a9920cee4c4d499beeffc1c663494a)]:
  - @baseplate-dev/sync@0.3.4
  - @baseplate-dev/fastify-generators@0.3.4
  - @baseplate-dev/react-generators@0.3.4
  - @baseplate-dev/project-builder-lib@0.3.4
  - @baseplate-dev/core-generators@0.3.4
  - @baseplate-dev/utils@0.3.4
  - @baseplate-dev/ui-components@0.3.4

## 2.0.3

### Patch Changes

- Updated dependencies []:
  - @baseplate-dev/core-generators@0.3.3
  - @baseplate-dev/fastify-generators@0.3.3
  - @baseplate-dev/project-builder-lib@0.3.3
  - @baseplate-dev/react-generators@0.3.3
  - @baseplate-dev/sync@0.3.3
  - @baseplate-dev/ui-components@0.3.3
  - @baseplate-dev/utils@0.3.3

## 2.0.2

### Patch Changes

- [#633](https://github.com/halfdomelabs/baseplate/pull/633) [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb) Thanks [@kingston](https://github.com/kingston)! - Add userAdminRoles configuration field to local auth plugin

  Adds a new `userAdminRoles` field to the local auth plugin definition that allows configuring which roles can manage users and assign roles to other users. This provides more granular control over user management permissions in the admin interface.
  - Added `userAdminRoles` field to plugin definition schema
  - Updated auth module generator to use configurable admin roles instead of hard-coded 'admin' role
  - Added UI configuration field in the local auth definition editor
  - Maintains backward compatibility with default empty array

- [#633](https://github.com/halfdomelabs/baseplate/pull/633) [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb) Thanks [@kingston](https://github.com/kingston)! - Add comprehensive password management capabilities to local auth plugin

  Introduces robust password management functionality for both users and administrators.

  **New Backend Features:**
  - Added `changeUserPassword` service function for users to change their own passwords (requires current password validation)
  - Added `resetUserPassword` service function for administrators to reset any user's password (no current password required)
  - Implemented `changePassword` GraphQL mutation with `['user']` authorization
  - Implemented `resetUserPassword` GraphQL mutation with admin authorization
  - Added comprehensive password validation and error handling
  - Supports creating password accounts for users who don't have password authentication configured

  **New Admin UI Features:**
  - Added `PasswordResetDialog` component for secure password reset functionality
  - Integrated password reset action into user management table dropdown menu
  - Added password confirmation field with client-side validation
  - Implemented proper form validation with configurable minimum password length
  - Added GraphQL code generation for new mutations

  **New Generator Framework:**
  - Created `adminCrudResetPasswordActionGenerator` mirroring the manage roles pattern
  - Added configurable password reset actions for admin CRUD interfaces
  - Supports both inline and dropdown action positioning
  - Includes template variables for password requirements and user model naming
  - Provides consistent integration with existing admin action containers

- Updated dependencies [[`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb), [`1419a96`](https://github.com/halfdomelabs/baseplate/commit/1419a965efd41d2b2dfb86dd18f32e5414a3af85), [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf), [`b4c15b9`](https://github.com/halfdomelabs/baseplate/commit/b4c15b98a518c53828f81624764ba693def85faf), [`04a4978`](https://github.com/halfdomelabs/baseplate/commit/04a49785642685ca4b56aec27dc0a18520674ef9), [`cca138a`](https://github.com/halfdomelabs/baseplate/commit/cca138a84abbb901ab628bf571ae29211a180dbb)]:
  - @baseplate-dev/project-builder-lib@0.3.2
  - @baseplate-dev/react-generators@0.3.2
  - @baseplate-dev/core-generators@0.3.2
  - @baseplate-dev/fastify-generators@0.3.2
  - @baseplate-dev/sync@0.3.2
  - @baseplate-dev/ui-components@0.3.2
  - @baseplate-dev/utils@0.3.2

## 2.0.1

### Patch Changes

- Updated dependencies [[`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788), [`d79b0cf`](https://github.com/halfdomelabs/baseplate/commit/d79b0cfb9061dbeccc976a2f018b264849bef788)]:
  - @baseplate-dev/core-generators@0.3.1
  - @baseplate-dev/react-generators@0.3.1
  - @baseplate-dev/fastify-generators@0.3.1
  - @baseplate-dev/project-builder-lib@0.3.1
  - @baseplate-dev/sync@0.3.1
  - @baseplate-dev/ui-components@0.3.1
  - @baseplate-dev/utils@0.3.1

## 2.0.0

### Major Changes

- [#622](https://github.com/halfdomelabs/baseplate/pull/622) [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65) Thanks [@kingston](https://github.com/kingston)! - This major refactor splits the monolithic auth plugin into a managed plugin architecture:

  ## Plugin Structure Changes
  - **Base auth plugin** (`auth`): Manages common functionality, roles, and provider selection
  - **Implementation plugins** (managed):
    - `local-auth`: Email/password authentication (renamed from original `auth` plugin)
    - `auth0`: Auth0 integration
    - `placeholder-auth`: Development/testing placeholder

  ## Key Changes

  ### Plugin Metadata System
  - **BREAKING**: Replace `manifest.json` with `plugin.json` for all plugins
  - **BREAKING**: Rename `id` to `key` in plugin metadata for URL consistency
  - Add `managedBy` field to plugin metadata for managed plugin relationships
  - Implement package.json-based plugin discovery configuration

  ### Managed Plugin Pattern
  - Implementation plugins are hidden from main plugin list
  - Base plugin automatically manages lifecycle of implementation plugins
  - UI shows "Managed Plugins" section grouped by manager
  - Configure buttons on managed plugins redirect to manager's config page

  ### Configuration Schema
  - Base auth plugin config includes `implementationPluginKey` to specify active provider
  - Roles configuration moved to base plugin (shared across implementations)
  - Provider-specific configs remain in implementation plugins

  ### UI Improvements
  - Add tabbed navigation (`AuthConfigTabs`) across all auth plugin interfaces
  - Dynamic provider selection within base plugin configuration
  - Consistent UX patterns between all auth implementation plugins

  ### Migration Support
  - Automatic migration of existing `plugin-auth` configs to new structure
  - Rename existing `plugin-auth_auth` to `plugin-auth_local-auth`
  - Auto-enable base auth plugin when implementation plugins are detected
  - Preserve all existing configuration without code changes needed

### Patch Changes

- [#623](https://github.com/halfdomelabs/baseplate/pull/623) [`82cee71`](https://github.com/halfdomelabs/baseplate/commit/82cee7183ef384e1777e7a563656441ff108e2b3) Thanks [@kingston](https://github.com/kingston)! - Support validating users on admin app based off their roles

- [#624](https://github.com/halfdomelabs/baseplate/pull/624) [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5) Thanks [@kingston](https://github.com/kingston)! - Upgrade Tanstack Router to 1.130.8 and revert from="/" workaround for Link bug

- [#625](https://github.com/halfdomelabs/baseplate/pull/625) [`96a3099`](https://github.com/halfdomelabs/baseplate/commit/96a3099ff9eba05fc3b3618b54407014cc555dc2) Thanks [@kingston](https://github.com/kingston)! - Add ability to set Prisma seed scripts and add seed script for local auth users

- Updated dependencies [[`aaf8634`](https://github.com/halfdomelabs/baseplate/commit/aaf8634abcf76d938072c7afc43e6e99a2519b13), [`82cee71`](https://github.com/halfdomelabs/baseplate/commit/82cee7183ef384e1777e7a563656441ff108e2b3), [`687a47e`](https://github.com/halfdomelabs/baseplate/commit/687a47e5e39abc5138ba3fc2d0db9cfee6e4dbfe), [`85e6413`](https://github.com/halfdomelabs/baseplate/commit/85e6413f8e3ad0043daca3bb9fa3ca5a27843a65), [`8ec33fc`](https://github.com/halfdomelabs/baseplate/commit/8ec33fcdc8fea9cb20e79586b854bf075270ab53), [`d0b08b8`](https://github.com/halfdomelabs/baseplate/commit/d0b08b89a07b9aa845212ec90e2a6123fbecbbe5), [`fbde70f`](https://github.com/halfdomelabs/baseplate/commit/fbde70ffbcae025318480e9607924978847fba2b), [`96a3099`](https://github.com/halfdomelabs/baseplate/commit/96a3099ff9eba05fc3b3618b54407014cc555dc2)]:
  - @baseplate-dev/ui-components@0.3.0
  - @baseplate-dev/react-generators@0.3.0
  - @baseplate-dev/sync@0.3.0
  - @baseplate-dev/project-builder-lib@0.3.0
  - @baseplate-dev/fastify-generators@0.3.0
  - @baseplate-dev/core-generators@0.3.0
  - @baseplate-dev/utils@0.3.0

## 1.0.6

### Patch Changes

- Updated dependencies [[`541db59`](https://github.com/halfdomelabs/baseplate/commit/541db59ccf868b6a6fcc8fa756eab0dfa560d193), [`e639251`](https://github.com/halfdomelabs/baseplate/commit/e639251f25094bb17f126e8604e505b1037b5640), [`cc6cd6c`](https://github.com/halfdomelabs/baseplate/commit/cc6cd6cce6bd0d97a68d7bd5b46408e0877d990b)]:
  - @baseplate-dev/react-generators@0.2.6
  - @baseplate-dev/ui-components@0.2.6
  - @baseplate-dev/project-builder-lib@0.2.6
  - @baseplate-dev/core-generators@0.2.6
  - @baseplate-dev/fastify-generators@0.2.6
  - @baseplate-dev/sync@0.2.6

## 1.0.5

### Patch Changes

- [#608](https://github.com/halfdomelabs/baseplate/pull/608) [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8) Thanks [@kingston](https://github.com/kingston)! - Refactor plugin migration system to separate config and project definition changes

  Previously, plugin migrations had mixed responsibilities - both transforming plugin config and mutating the project definition in the same unclear contract. This made the system hard to test and reason about.

  **New Migration Interface:**
  - `PluginMigrationResult` with explicit `updatedConfig` and `updateProjectDefinition` properties
  - Clear separation between config transformations and project definition updates
  - Better type safety and testability

  **Schema Version Bug Fix:**
  - Fixed bug where enabling plugins via UI didn't set `configSchemaVersion`
  - Plugin card now uses `PluginUtils.setPluginConfig` to automatically set correct schema version
  - Prevents unnecessary migrations when enabling new plugins

  **Migration Updates:**
  - All existing migrations updated to use new interface
  - Auth plugin migration: simple config-only transformation
  - Storage plugin migrations: migration #1 (config-only), migration #2 (config + project updates)

- [#608](https://github.com/halfdomelabs/baseplate/pull/608) [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8) Thanks [@kingston](https://github.com/kingston)! - Add React app configuration wrapper for user session provider and add useLogOut.gql file

- Updated dependencies [[`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`e0d690c`](https://github.com/halfdomelabs/baseplate/commit/e0d690c1e139f93a8ff60c9e0c90bc72cdf705a4), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`01c47c7`](https://github.com/halfdomelabs/baseplate/commit/01c47c77f039a463de03271de6461cd969d5a8e8), [`2aae451`](https://github.com/halfdomelabs/baseplate/commit/2aae45107cb6331234d14d8a6491b55e7f6d9f33)]:
  - @baseplate-dev/react-generators@0.2.5
  - @baseplate-dev/fastify-generators@0.2.5
  - @baseplate-dev/sync@0.2.5
  - @baseplate-dev/project-builder-lib@0.2.5
  - @baseplate-dev/core-generators@0.2.5
  - @baseplate-dev/ui-components@0.2.5

## 1.0.4

### Patch Changes

- Updated dependencies [[`ffe791f`](https://github.com/halfdomelabs/baseplate/commit/ffe791f6ab44e82c8481f3a18df9262dec71cff6)]:
  - @baseplate-dev/react-generators@0.2.4
  - @baseplate-dev/core-generators@0.2.4
  - @baseplate-dev/fastify-generators@0.2.4
  - @baseplate-dev/project-builder-lib@0.2.4
  - @baseplate-dev/sync@0.2.4
  - @baseplate-dev/ui-components@0.2.4

## 1.0.3

### Patch Changes

- [#595](https://github.com/halfdomelabs/baseplate/pull/595) [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb) Thanks [@kingston](https://github.com/kingston)! - Support front and backend of new auth plugin

- [#594](https://github.com/halfdomelabs/baseplate/pull/594) [`3107a1b`](https://github.com/halfdomelabs/baseplate/commit/3107a1b6917c3b2d14c7e91e2972b06955ebb4ea) Thanks [@kingston](https://github.com/kingston)! - Switch to typed GraphQL documents instead of older Apollo generator

- [#592](https://github.com/halfdomelabs/baseplate/pull/592) [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8) Thanks [@kingston](https://github.com/kingston)! - Update auth generators to better fit with Tanstack Router

- Updated dependencies [[`f3bd169`](https://github.com/halfdomelabs/baseplate/commit/f3bd169b8debc52628179ca6ebd93c20b8a6f841), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`3107a1b`](https://github.com/halfdomelabs/baseplate/commit/3107a1b6917c3b2d14c7e91e2972b06955ebb4ea), [`69eea11`](https://github.com/halfdomelabs/baseplate/commit/69eea11c3662fbad9b8d2283d5127195c8379c07), [`903e2d8`](https://github.com/halfdomelabs/baseplate/commit/903e2d898c47e6559f55f023eb89a0b524098f3a), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8), [`f0cb763`](https://github.com/halfdomelabs/baseplate/commit/f0cb7632f04bfb487722785fac7218d76d3b7e3b), [`a506e88`](https://github.com/halfdomelabs/baseplate/commit/a506e88893bf395916ef3fbf6dd9dd7c0ff17acb), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`059edf7`](https://github.com/halfdomelabs/baseplate/commit/059edf771755f1ff846494f238d777a9d1f7f5d7), [`de9e1b4`](https://github.com/halfdomelabs/baseplate/commit/de9e1b4f3a8a7dcf6b962781a0aa589eb970c7a8)]:
  - @baseplate-dev/core-generators@0.2.3
  - @baseplate-dev/sync@0.2.3
  - @baseplate-dev/react-generators@0.2.3
  - @baseplate-dev/fastify-generators@0.2.3
  - @baseplate-dev/ui-components@0.2.3
  - @baseplate-dev/project-builder-lib@0.2.3

## 1.0.2

### Patch Changes

- Updated dependencies [[`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`f8c9284`](https://github.com/halfdomelabs/baseplate/commit/f8c9284752c12c6aab70481bf98e6fa402e61075), [`b6bc11f`](https://github.com/halfdomelabs/baseplate/commit/b6bc11fdf199c8de40832eb88ea6f6cfc83aa5d7), [`dce88ac`](https://github.com/halfdomelabs/baseplate/commit/dce88ac8d1f951f7336c12c5e004107de3a23e97)]:
  - @baseplate-dev/sync@0.2.2
  - @baseplate-dev/react-generators@0.2.2
  - @baseplate-dev/project-builder-lib@0.2.2
  - @baseplate-dev/core-generators@0.2.2
  - @baseplate-dev/fastify-generators@0.2.2
  - @baseplate-dev/ui-components@0.2.2

## 1.0.1

### Patch Changes

- Updated dependencies [[`4d7677e`](https://github.com/halfdomelabs/baseplate/commit/4d7677e8ef2da8ed045ee7fe409519f0f124b34c), [`d7d9985`](https://github.com/halfdomelabs/baseplate/commit/d7d998540ca5886259f93b5020c4d8939c5cdf5f)]:
  - @baseplate-dev/ui-components@0.2.1
  - @baseplate-dev/react-generators@0.2.1
  - @baseplate-dev/core-generators@0.2.1
  - @baseplate-dev/project-builder-lib@0.2.1
  - @baseplate-dev/fastify-generators@0.2.1
  - @baseplate-dev/sync@0.2.1

## 1.0.0

### Patch Changes

- [#574](https://github.com/halfdomelabs/baseplate/pull/574) [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264) Thanks [@kingston](https://github.com/kingston)! - Refactored naming of project paths to output paths to be clearer about their meaning

- Updated dependencies [[`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`06b4faf`](https://github.com/halfdomelabs/baseplate/commit/06b4fafaf3d2ed848d959a9911b9bfa26702d4a3), [`3198895`](https://github.com/halfdomelabs/baseplate/commit/3198895bc45f6ff031e3d1e2c8554ddc3a30261d), [`f5d7a6f`](https://github.com/halfdomelabs/baseplate/commit/f5d7a6f781b1799bb8ad197973e5cec04f869264), [`fd63554`](https://github.com/halfdomelabs/baseplate/commit/fd635544eb6df0385501f61f3e51bce554633458), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9), [`a94eed9`](https://github.com/halfdomelabs/baseplate/commit/a94eed9c12236c5fb772d998b9c34ca876c10c13), [`56a3a89`](https://github.com/halfdomelabs/baseplate/commit/56a3a8944b9a557cca0484d78851fca10122e5f9)]:
  - @baseplate-dev/react-generators@0.2.0
  - @baseplate-dev/project-builder-lib@0.2.0
  - @baseplate-dev/fastify-generators@0.2.0
  - @baseplate-dev/core-generators@0.2.0
  - @baseplate-dev/ui-components@0.2.0
  - @baseplate-dev/sync@0.2.0

## 0.1.3

### Patch Changes

- [#564](https://github.com/halfdomelabs/baseplate/pull/564) [`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545) Thanks [@kingston](https://github.com/kingston)! - Add support for merging GraphQL object type requierments from Auth/Storage plugins

- [#562](https://github.com/halfdomelabs/baseplate/pull/562) [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad) Thanks [@kingston](https://github.com/kingston)! - Switch to Typescript project references for building/watching project

- Updated dependencies [[`8631cfe`](https://github.com/halfdomelabs/baseplate/commit/8631cfec32f1e5286d6d1ab0eb0e858461672545), [`30fdf49`](https://github.com/halfdomelabs/baseplate/commit/30fdf4988de244c30d13c93b7761587d4c1413ad)]:
  - @baseplate-dev/project-builder-lib@0.1.3
  - @baseplate-dev/fastify-generators@0.1.3
  - @baseplate-dev/react-generators@0.1.3
  - @baseplate-dev/core-generators@0.1.3
  - @baseplate-dev/ui-components@0.1.3
  - @baseplate-dev/sync@0.1.3

## 0.1.2

### Patch Changes

- [#560](https://github.com/halfdomelabs/baseplate/pull/560) [`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8) Thanks [@kingston](https://github.com/kingston)! - Add README files to all packages and plugins explaining their purpose within the Baseplate monorepo.

- Updated dependencies [[`7e38ae9`](https://github.com/halfdomelabs/baseplate/commit/7e38ae9102c7c8ea958d2dab94e76be848d1c1a8)]:
  - @baseplate-dev/project-builder-lib@0.1.2
  - @baseplate-dev/ui-components@0.1.2
  - @baseplate-dev/sync@0.1.2
  - @baseplate-dev/core-generators@0.1.2
  - @baseplate-dev/react-generators@0.1.2
  - @baseplate-dev/fastify-generators@0.1.2

## 0.1.1

### Patch Changes

- [#559](https://github.com/halfdomelabs/baseplate/pull/559) [`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b) Thanks [@kingston](https://github.com/kingston)! - Rename workspace to @baseplate-dev/\* and reset versions to 0.1.0

- [#557](https://github.com/halfdomelabs/baseplate/pull/557) [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad) Thanks [@kingston](https://github.com/kingston)! - Update LICENSE to modified MPL-2.0 license

- Updated dependencies [[`17dd71e`](https://github.com/halfdomelabs/baseplate/commit/17dd71e3b9f83e3359eb007f8eab1c4792bdbb8b), [`9caaa0a`](https://github.com/halfdomelabs/baseplate/commit/9caaa0aed05677a75fed79601dcfd24ec85ab5ad)]:
  - @baseplate-dev/project-builder-lib@0.1.1
  - @baseplate-dev/fastify-generators@0.1.1
  - @baseplate-dev/react-generators@0.1.1
  - @baseplate-dev/core-generators@0.1.1
  - @baseplate-dev/ui-components@0.1.1
  - @baseplate-dev/sync@0.1.1
