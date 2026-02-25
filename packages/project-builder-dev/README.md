# @baseplate-dev/project-builder-dev

Developer tooling CLI for Baseplate plugin authors. Provides the `baseplate-dev` binary with commands for template management, snapshots, and project synchronization.

## Usage

Install as a dev dependency in your plugin or monorepo:

```bash
pnpm add -D @baseplate-dev/project-builder-dev
```

Then run commands via:

```bash
pnpm baseplate-dev --help
```

## Commands

- **`templates`** — Extract, generate, create, list, and delete generator templates
- **`snapshot`** — Add, remove, save, and show project snapshots
- **`sync-examples`** — Sync all example projects in the nearest `examples/` directory
- **`serve`** — Start the project builder web UI (respects `EXCLUDE_EXAMPLES` and `EXAMPLES_DIRECTORIES`)
- **`dev-server`** — Start the MCP-integrated development server
- **`mcp`** — Start the MCP stdio server with full action set (templates, snapshots, sync, diff)

## Configuration

Environment variables (can be set in `.env` or `.env.local`):

| Variable | Description |
|----------|-------------|
| `PROJECT_DIRECTORIES` | Comma-separated paths to search for projects |
| `EXCLUDE_EXAMPLES` | Exclude example projects from discovery in `serve`/`listProjects` (examples included by default) |
| `EXAMPLES_DIRECTORIES` | Comma-separated paths to example directories (overrides auto-discovery for `sync-examples`) |
| `PLUGIN_ROOT_DIRECTORIES` | Comma-separated paths to additional root directories whose plugin deps are also discovered |
| `NO_BROWSER` | Disable auto-opening browser in `serve` |
| `PORT` | Port for the `serve` command |
| `PORT_OFFSET` | Offset added to the default port in `serve` |

## Programmatic API

```ts
import { generateProject } from '@baseplate-dev/project-builder-dev';

// Generates a Baseplate project from its project-definition.json
// Plugins are auto-discovered from the project directory's package.json
await generateProject('/path/to/project');
```
