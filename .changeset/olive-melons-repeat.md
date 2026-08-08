---
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/project-builder-dev': patch
---

The MCP server and CLI now load action handlers only when an action runs, cutting startup memory substantially, and the MCP server has moved to v2 of the Model Context Protocol SDK.
