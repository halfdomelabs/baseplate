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
- **`serve`** — Start the project builder web UI
- **`dev-server`** — Start the MCP-integrated development server
- **`mcp`** — Start the MCP stdio server with full action set (templates, snapshots, sync, diff)

## Configuration

### `baseplate.config.json`

Place a `baseplate.config.json` in the directory where you run `baseplate-dev`:

```json
{
  "exampleDirectory": "examples",
  "testDirectory": "tests",
  "pluginRootDirectories": ["plugins"]
}
```

| Field                   | Description                                                              |
| ----------------------- | ------------------------------------------------------------------------ |
| `exampleDirectory`      | Directory whose subdirectories are example projects                      |
| `testDirectory`         | Directory whose subdirectories are test projects                         |
| `pluginRootDirectories` | Array of directories to search for plugins                               |

All paths are relative to the config file location. All fields are optional.

### Environment Variables

| Variable              | Description                                  |
| --------------------- | -------------------------------------------- |
| `PROJECT_DIRECTORIES` | Comma-separated paths to search for projects |
| `NO_BROWSER`          | Disable auto-opening browser in `serve`      |
| `PORT`                | Port for the `serve` command                 |
| `PORT_OFFSET`         | Offset added to the default port in `serve`  |

## Programmatic API

```ts
import { generateProject } from '@baseplate-dev/project-builder-dev';

// Generates a Baseplate project from its project-definition.json
// Plugins are auto-discovered from the project directory's package.json
await generateProject('/path/to/project');
```
