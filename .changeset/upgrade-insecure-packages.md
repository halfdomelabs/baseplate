---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/plugin-auth': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/ui-components': patch
---

Upgrade insecure dependencies flagged by pnpm audit. Generated projects now use axios 1.18.1 (was 1.16.1) and better-auth 1.6.23 (was 1.6.11), addressing multiple axios advisories (prototype pollution, DoS, proxy handling) and a stored XSS advisory in better-auth. Transitive dependencies (js-yaml, brace-expansion, protobufjs, esbuild, body-parser) were also updated to patched versions in the monorepo and example lockfiles.
