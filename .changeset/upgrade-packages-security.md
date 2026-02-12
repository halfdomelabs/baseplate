---
'@baseplate-dev/code-morph': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/fastify-generators': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-common': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-test': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/sync': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/plugin-email': patch
'@baseplate-dev/plugin-queue': patch
'@baseplate-dev/plugin-rate-limit': patch
'@baseplate-dev/plugin-storage': patch
---

Upgrade packages to fix security vulnerabilities and update to latest versions

**Security fixes:**
- @modelcontextprotocol/sdk: 1.25.1 → 1.26.0 (fixes CVE-2026-25536 - cross-client data leak)
- fastify: 5.6.2 → 5.7.4 (security patches)
- diff: 8.0.2 → 8.0.3 (fixes CVE-2026-24001 - DoS vulnerability)
- testcontainers: 11.10.0 → 11.11.0 (fixes undici vulnerability)

**Package updates:**
- @tailwindcss/vite: 4.1.13 → 4.1.18
- tailwindcss: 4.1.13 → 4.1.18
- @tanstack/react-router: 1.139.7 → 1.159.5
- @tanstack/router-plugin: 1.139.7 → 1.159.5
- @testing-library/jest-dom: 6.6.3 → 6.9.1
- concurrently: 9.0.1 → 9.2.1
- ts-morph: 26.0.0 → 27.0.2

All packages tested and verified across the monorepo and generated projects.
