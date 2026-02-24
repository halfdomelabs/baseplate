---
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
---

Upgrade packages to fix security vulnerabilities

- @aws-sdk/client-s3, @aws-sdk/lib-storage, @aws-sdk/s3-presigned-post, @aws-sdk/s3-request-presigner: 3.990.0 → 3.995.0 (fixes fast-xml-parser CVE-2025-69873 critical, CVE DoS high)
- postmark: 4.0.5 → 4.0.7 (fixes axios DoS vulnerability)
- fastify-auth0-verify: 3.0.0 → 4.1.0 (updates @fastify/jwt to v10)
