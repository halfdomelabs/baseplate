---
'@baseplate-dev/react-generators': minor
'@baseplate-dev/project-builder-lib': minor
'@baseplate-dev/project-builder-server': minor
'@baseplate-dev/project-builder-web': minor
---

Web apps can now opt in to sourcing their shared UI components (Button, Dialog, Toaster, form controls, etc.) from a `react-library` package instead of generating a local copy — pick a "Components Library" on the web app's settings page and the library gets the component source once while the app imports everything by package name, so multiple apps can share one component set instead of duplicating it.
