---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-web': patch
---

Upgrade Vite and Module Federation packages

Monorepo catalog and generator constants:

- vite: 8.0.16 → 8.1.0
- @vitejs/plugin-react: 6.0.2 → 6.0.3
- vite-plugin-svgr: 4.5.0 → 5.2.0
- @tailwindcss/vite: 4.3.0 → 4.3.1
- tailwindcss: 4.3.0 → 4.3.1

Module Federation (Baseplate web app only):

- @module-federation/enhanced: 2.3.3 → 2.6.0
- @module-federation/vite: 1.15.4 → 1.16.11

Generated projects now resolve the `@src/*` path alias via Vite's built-in
`resolve.tsconfigPaths` option (in both the Vite and Vitest configs) instead of
the `vite-tsconfig-paths` plugin, which has been dropped as a dependency.
