---
'@baseplate-dev/project-builder-web': patch
---

Made the dev server's plugin asset middleware non-blocking by switching from synchronous `fs` calls (and a `setInterval` polling loop) to async `fs/promises` reads, reducing event-loop contention when the web app loads plugin module federation bundles during local development.
