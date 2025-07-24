---
'@baseplate-dev/project-builder-lib': patch
---

Add schema migration for web admin configuration support. This migration converts existing admin apps to web apps with adminConfig enabled, and adds the adminConfig field to existing web apps. This enables backward compatibility when upgrading projects to the unified web admin interface.
