---
'@baseplate-dev/plugin-storage': patch
---

Support `Readable` streams in addition to `Buffer` when calling the server-side `uploadFile`, enabling streaming uploads without buffering the full file in memory.
