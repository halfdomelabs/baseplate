---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
---

Add PORT_OFFSET support for parallel development environments

- Added PORT_OFFSET environment variable to run multiple dev container instances
- Changed default ports to safer, more memorable ranges (4300, 4400, 4500)
- Server, web, and dev server ports now respect PORT_OFFSET from root .env file
- Each instance can run on predictable, non-conflicting ports
- Created helper script for setting up parallel environments with different offsets
