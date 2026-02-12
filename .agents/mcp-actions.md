## Baseplate Development Server MCP

Baseplate includes an integrated MCP (Model Context Protocol) server that provides programmatic access to core development operations. The MCP server is configured in `.mcp.json` and can be accessed via Claude Code MCP tools.

### Configuration

The MCP server is configured to run via:

```bash
pnpm start mcp
```

### Available MCP Actions

The following actions are available through the Baseplate development server MCP integration:

#### `diff-project`

Generate a diff between what would be generated and what currently exists in the working directory.

**Parameters:**

- `project` (required): The name or ID of the project to diff
- `compact` (optional): Whether to show compact diff format
- `packages` (optional): Only show diffs for specific packages
- `include` (optional): Filter files by glob patterns

**Usage:**

```javascript
mcp__baseplate_dev_server__diff_project({
  project: 'my-project',
  compact: true,
});
```

#### `sync-project`

Sync the specified project using the baseplate sync engine.

**Parameters:**

- `project` (required): The name or ID of the project to sync
- `overwrite` (optional): Whether to force overwrite existing files and apply snapshot
- `skipCommands` (optional): Whether to skip running commands
- `snapshotDirectory` (optional): Directory containing snapshot to use when generating

**Usage:**

```javascript
mcp__baseplate_dev_server__sync_project({
  project: 'my-project',
  overwrite: false,
});
```

#### `delete-template`

Delete a template by looking up its metadata from the file path and removing all associated files (template file, metadata, and generated file).

**Parameters:**

- `filePath` (required): Path to file to delete (absolute or relative)
- `project` (optional): Project name or ID (required for relative paths, optional for absolute)

**Usage:**

```javascript
// Delete template using absolute path
mcp__baseplate_dev_server__delete_template({
  filePath: '/path/to/project/src/components/my-component.tsx',
});

// Delete template using relative path (requires project)
mcp__baseplate_dev_server__delete_template({
  filePath: 'src/components/my-component.tsx',
  project: 'my-project',
});
```

#### `extract-templates`

Extract templates from the specified project and app.

**Parameters:**

- `project` (required): The name or ID of the project to extract templates from
- `app` (required): The app name to extract templates from
- `autoGenerateExtractor` (optional, default: true): Auto-generate extractor.json files
- `skipClean` (optional, default: false): Skip cleaning the output directories

**Usage:**

```javascript
mcp__baseplate_dev_server__extract_templates({
  project: 'my-project',
  app: 'my-app',
});
```

#### `generate-templates`

Generate typed template files from existing extractor.json configurations.

**Parameters:**

- `project` (optional): Specify the project to source the generators from
- `skipClean` (optional, default: false): Skip cleaning the output directories

**Usage:**

```javascript
mcp__baseplate_dev_server__generate_templates({
  project: 'my-project',
});
```

#### `create-generator`

Create a new generator with boilerplate code, including generator file, index, and optional template setup.

**Parameters:**

- `name` (required): Generator name in format "category/name" (e.g., "email/sendgrid")
- `directory` (required): Directory to create generator in (e.g., "packages/fastify-generators/src/generators")
- `includeTemplates` (optional, default: true): Include placeholder template setup

**Usage:**

```javascript
mcp__baseplate_dev_server__create_generator({
  name: 'email/sendgrid',
  directory: 'packages/fastify-generators/src/generators',
  includeTemplates: true,
});
```

**Example directories:**

- `packages/core-generators/src/generators`
- `packages/fastify-generators/src/generators`
- `packages/react-generators/src/generators`
- `plugins/plugin-storage/src/generators/fastify`

#### `list-templates`

List all available generators with their templates.

**Parameters:**

- `project` (optional): Specify the project to source the generators from

**Usage:**

```javascript
mcp__baseplate_dev_server__list_templates({
  project: 'my-project',
});
```

#### `show-template-metadata`

Show template metadata for a file by looking up information from .templates-info.json.

**Parameters:**

- `filePath` (required): Path to file to show metadata for (absolute or relative)
- `project` (optional): Project name or ID (required for relative paths, optional for absolute)

**Usage:**

```javascript
// Show metadata using absolute path
mcp__baseplate_dev_server__show_template_metadata({
  filePath: '/path/to/project/src/components/my-component.tsx',
});

// Show metadata using relative path (requires project)
mcp__baseplate_dev_server__show_template_metadata({
  filePath: 'src/components/my-component.tsx',
  project: 'my-project',
});
```

#### `snapshot-add`

Add files to snapshot for persistent differences tracking.

**Parameters:**

- `project` (required): The name or ID of the project
- `app` (required): The app name within the project
- `files` (required): Array of file paths to add to snapshot
- `deleted` (optional): Mark files as intentionally deleted in snapshot
- `snapshotDirectory` (optional): Custom snapshot directory (defaults to .baseplate-snapshot)

**Usage:**

```javascript
mcp__baseplate_dev_server__snapshot_add({
  project: 'blog-with-auth',
  app: 'backend',
  files: ['src/custom-file.ts'],
  deleted: false,
});
```

#### `snapshot-remove`

Remove files from snapshot tracking.

**Parameters:**

- `project` (required): The name or ID of the project
- `app` (required): The app name within the project
- `files` (required): Array of file paths to remove from snapshot
- `snapshotDirectory` (optional): Custom snapshot directory (defaults to .baseplate-snapshot)

**Usage:**

```javascript
mcp__baseplate_dev_server__snapshot_remove({
  project: 'blog-with-auth',
  app: 'backend',
  files: ['src/file-to-untrack.ts'],
});
```

#### `snapshot-save`

Save snapshot of current differences (overwrites existing snapshot).

**Parameters:**

- `project` (required): The name or ID of the project
- `app` (required): The app name within the project
- `snapshotDirectory` (optional): Custom snapshot directory (defaults to .baseplate-snapshot)
- `force` (optional): Skip confirmation prompt and force save snapshot

**Usage:**

```javascript
mcp__baseplate_dev_server__snapshot_save({
  project: 'blog-with-auth',
  app: 'backend',
  force: true,
});
```

#### `snapshot-show`

Display current snapshot contents and tracked files.

**Parameters:**

- `project` (required): The name or ID of the project
- `app` (required): The app name within the project
- `snapshotDirectory` (optional): Custom snapshot directory (defaults to .baseplate-snapshot)

**Usage:**

```javascript
mcp__baseplate_dev_server__snapshot_show({
  project: 'blog-with-auth',
  app: 'backend',
});
```
