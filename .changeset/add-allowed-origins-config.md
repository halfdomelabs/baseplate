---
'@baseplate-dev/plugin-auth': patch
---

Add ALLOWED_ORIGINS environment variable for CSRF protection

- Add optional `ALLOWED_ORIGINS` config field that accepts a comma-separated list of additional allowed origins
- Enables use cases with hosting providers like Render that use rewrites where the host header doesn't match the origin header
