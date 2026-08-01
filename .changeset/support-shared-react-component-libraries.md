---
'@baseplate-dev/core-generators': minor
'@baseplate-dev/react-generators': minor
'@baseplate-dev/project-builder-lib': minor
'@baseplate-dev/project-builder-server': minor
'@baseplate-dev/project-builder-web': minor
---

React library packages now support Tailwind (with matching lint/prettier tooling) and peer dependencies on react/react-dom, and web apps can import them as shared component libraries — pick libraries to import from the web app's settings page and the generated app gets a workspace dependency plus Tailwind class scanning for the library's source automatically.
