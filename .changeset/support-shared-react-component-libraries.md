---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

You can now create `react-library` packages for sharing JSX components and hooks across a monorepo, with Tailwind and lint/prettier tooling configured for you. Pick libraries to import from a web app's settings page and the app sources its shared UI components from them instead of generating a local copy.
