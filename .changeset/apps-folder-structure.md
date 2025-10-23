---
'@baseplate-dev/project-builder-lib': patch
---

BREAKING: Remove `packageLocation` field and standardize app locations to `apps/{appName}`

The `packageLocation` field has been removed from app configurations. All apps now use a standardized location pattern: `apps/{appName}`.

**Migration required for existing projects:**

1. Move your app folders from `packages/` to `apps/`
2. Update `pnpm-workspace.yaml` to use `apps/*` instead of `packages/*`
