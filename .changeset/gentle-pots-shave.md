---
'@baseplate-dev/plugin-storage': patch
---

Permission-gate presigned download URLs and file downloads. Previously a file category without a `presignedRead` rule allowed any caller who knew a file id to read it, and no rule was ever generated, so all stored files were effectively public; read access is now derived from the referencing model's read policy and the file relation's own field permissions, and categories with no derivable rule deny non-system callers instead of allowing them. Categories whose referencing model has no authorizer roles (including `disableAutoCleanup` categories with no relations) now require a hand-written `authorize.presignedRead` to permit access.
