---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Move Docker Compose generation from backend to root package

Docker Compose configuration is now generated at the monorepo root instead of within individual backend packages. This provides a better developer experience with a single `docker compose up` command from the project root.

**Breaking Changes:**

- Docker files now generate at `docker/` (root) instead of `apps/backend/docker/`
- `enableRedis` removed from backend app configuration - moved to project-level infrastructure settings
- New Infrastructure settings page for configuring Redis (Postgres is always enabled)
