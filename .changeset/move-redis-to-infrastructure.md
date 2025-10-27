---
'@baseplate-dev/project-builder-lib': patch
---

Add migration to move enableRedis from backend apps to infrastructure settings. Redis configuration is now stored at settings.infrastructure.redis.enabled instead of individual backend app settings, allowing for centralized infrastructure configuration across the monorepo.
