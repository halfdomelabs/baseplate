---
'@baseplate-dev/project-builder-server': patch
---

Cascade model→model relation deletions when staging a model delete via MCP, so deleting a model auto-removes the relations on other models that referenced it.
