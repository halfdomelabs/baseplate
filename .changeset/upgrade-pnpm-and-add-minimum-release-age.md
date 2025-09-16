---
'@baseplate-dev/create-project': patch
---

Upgrade PNPM to 10.16.1 and add minimumReleaseAge security setting

- Upgraded PNPM from 10.15.0 to 10.16.1 across all package.json files
- Added minimumReleaseAge=1440 (24 hours) to .npmrc files to delay installation of newly released dependencies
- This security setting reduces risk of installing compromised packages by ensuring only packages released at least one day ago can be installed
- Updated project creation template to include the new security setting for all new Baseplate projects
