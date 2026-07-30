---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-dev': patch
---

The dev MCP server now starts even when a plugin directory cannot be scanned, such as when a package.json still has unresolved merge conflict markers during an upgrade. Discovery failures are reported as warnings and listed by the list-plugins action rather than aborting startup, and a package.json containing conflict markers now reports that the conflict needs resolving instead of a generic JSON parse error.
