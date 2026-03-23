# Baseplate MCP Server

This project uses [Baseplate](https://www.baseplate.dev) for code generation. You can interact with Baseplate through its MCP server to make structural changes to the project.

## MCP Server Setup

If the Baseplate MCP server is not already configured, ask the user to set it up using one of the following commands:

{{TPL_MCP_SETUP_INSTRUCTIONS}}

## Common MCP Actions

### Browsing the Project

- `list-entity-types` — See what kinds of entities exist (models, features, apps, etc.)
- `list-entities` — List all entities of a given type
- `get-entity` — View the full definition of a specific entity
- `get-entity-schema` — View the schema for an entity type to understand valid fields
- `search-entities` — Search entities by name

### Making Changes

The MCP server uses a draft-based workflow:

1. `stage-create-entity`, `stage-update-entity`, or `stage-delete-entity` — Queue changes in a draft
2. `show-draft` — Review pending changes before applying
3. `commit-draft` — Apply changes to `project-definition.json`
4. `discard-draft` — Cancel all pending changes

### Syncing Generated Code

After committing changes to the project definition, sync generated code:

- `sync-project` — Regenerate and sync all code from the updated definition

### Plugin Management

- `list-plugins` — List available plugins and their enabled/disabled status
- `configure-plugin` — Enable a plugin or update its configuration (staged in draft)
- `disable-plugin` — Disable a plugin (staged in draft)

## Data Models

The project definition (`baseplate/project-definition.json`) defines models, features, apps, and plugins.

### Modifying Models

Use the MCP server to modify models safely:

1. `get-entity-schema` with entity type `model` — Understand the model structure
2. `stage-create-entity` or `stage-update-entity` — Queue model changes
3. `show-draft` — Review the proposed changes
4. `commit-draft` — Apply the changes
5. `sync-project` — Regenerate code from the updated definition

### Model Structure

Each model has:

- **name** — The model name (PascalCase)
- **fields** — Array of field definitions with types, constraints, and defaults
- **relations** — References to other models (one-to-one, one-to-many, many-to-many)
- **indexes** — Database indexes for query performance

Common field types: `string`, `int`, `float`, `boolean`, `datetime`, `json`, `enum`

## Tips

- **Prefer MCP tools over editing `project-definition.json` directly** — The MCP server validates changes and maintains referential integrity
- **Always review the draft** before committing to catch unintended changes
- **Sync after committing** — Run `sync-project` after making definition changes to regenerate code
- The generated code is in `baseplate/generated/` directories — do not edit these files directly
- Customizations go in the non-generated source files which will be merged with generated code
