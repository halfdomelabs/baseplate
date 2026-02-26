# @baseplate-dev/plugin-email

## 0.1.4

### Patch Changes

- [#778](https://github.com/halfdomelabs/baseplate/pull/778) [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04) Thanks [@kingston](https://github.com/kingston)! - Upgrade packages to fix security vulnerabilities
  - @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner: 3.990.0 → 3.995.0 (fixes fast-xml-parser CVE-2025-69873 critical, CVE DoS high)
  - postmark: 4.0.5 → 4.0.7 (fixes axios DoS vulnerability)
  - fastify-auth0-verify: 3.0.0 → 4.1.0 (updates @fastify/jwt to v10)

- Updated dependencies [[`bd1095e`](https://github.com/halfdomelabs/baseplate/commit/bd1095e52dc3cecdb40bf84a906490a7c92fec40), [`1225fda`](https://github.com/halfdomelabs/baseplate/commit/1225fdace3e8da20152e0e78c4decf0c063faa56), [`3029d42`](https://github.com/halfdomelabs/baseplate/commit/3029d42f5d5967721f2b0d5892ea07a80c5f3a1f), [`d6be7a9`](https://github.com/halfdomelabs/baseplate/commit/d6be7a97b5e6970be674bf9b49eddf1499b51f04), [`eadad84`](https://github.com/halfdomelabs/baseplate/commit/eadad8494128ded2cbc76dfbe3b97f93769ea41f), [`dc238be`](https://github.com/halfdomelabs/baseplate/commit/dc238be00158a528a60d9e6ef9cec32b2d8297be), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704), [`634f6c5`](https://github.com/halfdomelabs/baseplate/commit/634f6c5aaffab982a985be9f85062de9d1e8a99b), [`78315cc`](https://github.com/halfdomelabs/baseplate/commit/78315ccd9b0b0330cd2d08584c6d5ec516d641e3), [`2104145`](https://github.com/halfdomelabs/baseplate/commit/210414588d8b1f6816c45054be3b7eea5763b5ce), [`bd25ff0`](https://github.com/halfdomelabs/baseplate/commit/bd25ff08e71faeb97b560e7b349dba1967155704)]:
  - @baseplate-dev/project-builder-lib@0.5.4
  - @baseplate-dev/fastify-generators@0.5.4
  - @baseplate-dev/react-generators@0.5.4
  - @baseplate-dev/plugin-queue@2.0.4
  - @baseplate-dev/core-generators@0.5.4
  - @baseplate-dev/sync@0.5.4
  - @baseplate-dev/ui-components@0.5.4
  - @baseplate-dev/utils@0.5.4

## 0.1.3

### Patch Changes

- [#769](https://github.com/halfdomelabs/baseplate/pull/769) [`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504) Thanks [@kingston](https://github.com/kingston)! - Fix hard-coded email template imports in auth plugin

- Updated dependencies [[`cb2446e`](https://github.com/halfdomelabs/baseplate/commit/cb2446e235794bf5d45a1671ae320ccce12eb504), [`6c190fe`](https://github.com/halfdomelabs/baseplate/commit/6c190fe50240f0ddc984af757b7900d053433bb1), [`254d675`](https://github.com/halfdomelabs/baseplate/commit/254d675079930e5b569bf1c0c4576f1459d23a03), [`9129381`](https://github.com/halfdomelabs/baseplate/commit/9129381e17504136837d07deb9958708791da43e)]:
  - @baseplate-dev/core-generators@0.5.3
  - @baseplate-dev/fastify-generators@0.5.3
  - @baseplate-dev/react-generators@0.5.3
  - @baseplate-dev/plugin-queue@2.0.3
  - @baseplate-dev/project-builder-lib@0.5.3
  - @baseplate-dev/sync@0.5.3
  - @baseplate-dev/ui-components@0.5.3
  - @baseplate-dev/utils@0.5.3

## 0.1.2

### Patch Changes

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add emailTemplateSpec for cross-plugin email template registration

  Introduces `emailTemplateSpec` in plugin-email, allowing other plugins to register email template generators with the transactional library compilation process. The auth plugin now uses this spec to register password-reset, password-changed, and account-verification email templates as proper generators instead of using snapshots. Also exports `emailTemplatesProvider` and adds component project exports to enable cross-generator template imports.

- [#759](https://github.com/halfdomelabs/baseplate/pull/759) [`7e58d6a`](https://github.com/halfdomelabs/baseplate/commit/7e58d6a5d6c62b1bb5822ccec2a172aeac6190a3) Thanks [@kingston](https://github.com/kingston)! - Add password reset flow
  - **Backend**: Password reset service with secure token generation (SHA-256 hashed, single-use, 1-hour expiry), rate limiting (per-IP, per-email, global), and session invalidation on reset
  - **Backend**: GraphQL mutations for requesting reset, validating tokens, and completing reset
  - **Backend**: `AUTH_FRONTEND_URL` config field for constructing reset email links
  - **Frontend**: Forgot password and reset password pages with proper error handling
  - **Frontend**: Shared auth constants file for password validation limits
  - **Email**: Password changed confirmation email template
  - **Email**: Added `sendEmail` as a project export from the email module

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

- Updated dependencies [[`ef1354d`](https://github.com/halfdomelabs/baseplate/commit/ef1354da11e2c48a80af03f44834555ce63a2948), [`b4db947`](https://github.com/halfdomelabs/baseplate/commit/b4db947f256c4b8639d7f18ffb58bb2b1646c497), [`683eb15`](https://github.com/halfdomelabs/baseplate/commit/683eb15c2c37259266959e0760b419e07f70a27e), [`938a7b1`](https://github.com/halfdomelabs/baseplate/commit/938a7b113550a7a245b65b5dfe3cc641f11096b7), [`02740a6`](https://github.com/halfdomelabs/baseplate/commit/02740a6e230c7fbf28fc768543353e847671c51b), [`dd40bcd`](https://github.com/halfdomelabs/baseplate/commit/dd40bcd219c79f0cd7b66c0427c77deda0664072), [`7d1a9d6`](https://github.com/halfdomelabs/baseplate/commit/7d1a9d6d381279434f2ac632e9f8accde34dda25), [`63bd074`](https://github.com/halfdomelabs/baseplate/commit/63bd074b3b24b0978d4271a5bc76a8531b0f60c2)]:
  - @baseplate-dev/fastify-generators@0.5.2
  - @baseplate-dev/project-builder-lib@0.5.2
  - @baseplate-dev/react-generators@0.5.2
  - @baseplate-dev/core-generators@0.5.2
  - @baseplate-dev/ui-components@0.5.2
  - @baseplate-dev/sync@0.5.2
  - @baseplate-dev/plugin-queue@2.0.2
  - @baseplate-dev/utils@0.5.2

## 0.1.1

### Patch Changes

- [#740](https://github.com/halfdomelabs/baseplate/pull/740) [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534) Thanks [@kingston](https://github.com/kingston)! - Add email plugin with Postmark implementation for queue-based email delivery
  - Add `@baseplate-dev/plugin-email/transactional-lib` library type for generating transactional email libraries
  - Include reusable email components (Button, Heading, Text, Link, Divider, Section, Layout)

- Updated dependencies [[`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534), [`ecebd3b`](https://github.com/halfdomelabs/baseplate/commit/ecebd3bf50cfa2d2a62501e0be39c411b42bed25), [`ff4203e`](https://github.com/halfdomelabs/baseplate/commit/ff4203e45a057b25a0ded5ecb3e1c07f5c7108b4), [`1debcb8`](https://github.com/halfdomelabs/baseplate/commit/1debcb89807fafdd7415a659f4bebbad0d69f072), [`55aa484`](https://github.com/halfdomelabs/baseplate/commit/55aa484621f2dc5b1195b6b537e7d6ad215bc499), [`2de5d5c`](https://github.com/halfdomelabs/baseplate/commit/2de5d5c43c5354571d50707a99b4028ff8792534)]:
  - @baseplate-dev/fastify-generators@0.5.1
  - @baseplate-dev/react-generators@0.5.1
  - @baseplate-dev/project-builder-lib@0.5.1
  - @baseplate-dev/plugin-queue@2.0.1
  - @baseplate-dev/core-generators@0.5.1
  - @baseplate-dev/sync@0.5.1
  - @baseplate-dev/ui-components@0.5.1
