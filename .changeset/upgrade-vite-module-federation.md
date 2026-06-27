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
- vite-tsconfig-paths: 5.1.4 → 6.1.1
- @tailwindcss/vite: 4.3.0 → 4.3.1
- tailwindcss: 4.3.0 → 4.3.1

Module Federation (Baseplate web app only):

- @module-federation/enhanced: 2.3.3 → 2.6.0
- @module-federation/vite: 1.15.4 → 1.16.11
