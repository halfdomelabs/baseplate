# CLAUDE.md

See [AGENTS.md](AGENTS.md) for full project context, build commands, and conventions.

## Claude-Specific Notes

- **Prefer Baseplate MCP tools** over editing `project-definition.json` directly — the MCP server validates changes and maintains referential integrity
- See `.agents/baseplate.md` for MCP server usage, data model changes, and plugin management
- See `.agents/authorization.md` for the authorization model and expression DSL
- Generated code lives in `baseplate/generated/` directories — do not edit these files directly
