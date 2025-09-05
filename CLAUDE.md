# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

See @.cursor/rules/dev-commands.mdc for dev commands for building and testing.

## Code Style Guidelines

See @.cursor/rules/code-style.mdc for code style guidelines.

## UI Development Guidelines

See @.cursor/rules/ui-rules.mdc for UI development guidelines.

### UI Components Quick Reference

The `@baseplate-dev/ui-components` package provides 52+ production-ready components. Import components like:

```typescript
import { Button, Input, Card, Dialog } from '@baseplate-dev/ui-components';
```

#### Basic Components

- **Alert** - Status/notification messages with variants (default, destructive, warning, success)
- **Badge** - Status indicators and labels with semantic colors
- **Button** - Primary action elements (default, destructive, outline, secondary, ghost, link)
- **Button Group** - Grouped button layouts for related actions
- **Card** - Content containers with optional header/footer
- **Label** - Accessible form labels with proper associations
- **Separator** - Visual dividers (horizontal/vertical)
- **Loader** - Loading indicators with spinner animation
- **Circular Progress** - Progress indicators with percentage display

#### Form Components

All form components have both standalone and React Hook Form controller variants:

- **Input / Input Field** - Text inputs with validation support
- **Textarea / Textarea Field** - Multi-line text areas with auto-resize
- **Select / Select Field** - Dropdown selections with search
- **Checkbox / Checkbox Field** - Boolean inputs with indeterminate state
- **Switch / Switch Field** - Toggle switches for on/off states
- **Combobox / Combobox Field** - Searchable select with custom options
- **Multi Combobox / Multi Combobox Field** - Multi-select with tag display
- **Color Picker / Color Picker Field** - Color selection with palette
- **Date Picker Field** - Date selection with calendar popup
- **Date Time Picker Field** - Combined date and time selection
- **Form Item** - Wrapper for form fields with label, description, error
- **Form Action Bar** - Consistent form action buttons (Save, Cancel, etc.)

#### Layout Components

- **Sidebar Layout** - App layout with collapsible sidebar and main content
- **Section List** - Organized content sections with headers
- **Record View** - Display data records in consistent format
- **Table** - Data tables with sorting, filtering, and pagination
- **Tabs** - Tabbed content areas with keyboard navigation
- **Navigation Menu** - App navigation with nested menu support
- **Navigation Tabs** - Tab-based navigation for page sections
- **Breadcrumb** - Navigation breadcrumbs with separator customization
- **Scroll Area** - Custom scrollable areas with styled scrollbars

#### Interactive Components

- **Dialog** - Modal dialogs with overlay and focus management
- **Sheet** - Slide-out panels from any side (top, right, bottom, left)
- **Popover** - Floating content positioned relative to trigger
- **Dropdown** - Dropdown menus with keyboard navigation
- **Command** - Command palette interface with search and shortcuts
- **Tooltip** - Hover information with directional positioning
- **Confirm Dialog** - Confirmation dialogs for destructive actions
- **Calendar** - Date calendar widget with selection ranges
- **Toaster** - Toast notifications with auto-dismiss

#### Display Components

- **Empty Display** - Empty state messaging with illustration and actions
- **Error Display** - Error state messaging with retry functionality
- **Errorable Loader** - Loading states with error handling

#### Component Usage Patterns

**Form Integration:**

```typescript
import { useForm } from 'react-hook-form';
import { InputField, SelectField, FormActionBar } from '@baseplate-dev/ui-components';

const form = useForm();

<form>
  <InputField
    control={form.control}
    name="title"
    label="Title"
    placeholder="Enter title..."
  />
  <SelectField
    control={form.control}
    name="category"
    label="Category"
    options={[
      { label: 'Option 1', value: '1' },
      { label: 'Option 2', value: '2' }
    ]}
  />
  <FormActionBar>
    <Button type="submit">Save</Button>
    <Button variant="outline" type="button">Cancel</Button>
  </FormActionBar>
</form>
```

**Layout Structure:**

```typescript
import { SidebarLayout, Card, Breadcrumb } from '@baseplate-dev/ui-components';

<SidebarLayout navigation={<NavigationMenu items={navItems} />}>
  <div className="space-y-6">
    <Breadcrumb items={breadcrumbItems} />
    <Card>
      <Card.Header>
        <Card.Title>Page Title</Card.Title>
      </Card.Header>
      <Card.Content>
        {/* Page content */}
      </Card.Content>
    </Card>
  </div>
</SidebarLayout>
```

**Interactive Dialogs:**

```typescript
import {
  Dialog,
  ConfirmDialog,
  useConfirmDialog,
} from '@baseplate-dev/ui-components';

const confirmDialog = useConfirmDialog();

const handleDelete = async () => {
  const confirmed = await confirmDialog({
    title: 'Delete Item',
    description: 'This action cannot be undone.',
    confirmText: 'Delete',
    cancelText: 'Cancel',
  });

  if (confirmed) {
    // Perform deletion
  }
};
```

For detailed component documentation and examples, see the Storybook at `packages/ui-components/storybook-static/index.html` or run `pnpm storybook:dev` in the ui-components package.

## Testing Best Practices

See @.cursor/rules/testing.mdc for testing best practices.

## Repository Structure

Baseplate is organized into several core packages:

### Project Builder

- **packages/project-builder-cli**: CLI application that starts the server and web interface
- **packages/project-builder-web**: React app for configuring project definitions
- **packages/project-builder-server**: Fastify-based backend API for the web interface using TRPC
- **packages/project-builder-lib**: Shared library with common logic and schema definitions
- **packages/project-builder-common**: Common types and utilities shared across builder packages
- **packages/project-builder-test**: Test runner and utilities for integration testing
- **packages/create-project**: CLI tool for bootstrapping new Baseplate projects
- **packages/ui-components**: Reusable UI component library with Storybook

### Sync Engine

- **packages/sync**: Core package orchestrating code generation workflow
- **packages/core-generators**: Generates TypeScript code and base abstractions
- **packages/react-generators**: Generates React components and structure
- **packages/fastify-generators**: Generates Fastify-based backend code

### Utilities

- **packages/code-morph**: Tools for codebase transformations
- **packages/tools**: Common configurations (ESLint, Prettier, TSConfig, Vitest)
- **packages/utils**: Utility functions

### Plugins

- **plugins/plugin-auth**: Authentication plugin (includes auth0 and local auth implementations)
- **plugins/plugin-storage**: Storage plugin (S3 and local file storage)

## Architecture Overview

Baseplate consists of two main tiers:

1. **Project Builder**: UI-driven configuration tool that produces a project definition (JSON)
   - Allows configuring data models, authentication, etc.
   - Compiles high-level definitions into generator bundles

2. **Sync Engine**: Code generation system that processes generator bundles
   - Executes generators in dependency order
   - Handles Task Phases for multi-stage code generation
   - Manages Dynamic Tasks for data-driven generation
   - Uses Provider Scopes for communication between tasks
   - Merges generated code with existing codebase using Git Diff3

## Key Concepts

### Generators

- Created with `createGenerator`
- Define configuration via descriptor schema (Zod)
- Consist of one or more tasks

### Tasks

- Created with `createGeneratorTask`
- Have `run` (initialization) and `build` (code generation) phases
- Export and consume providers
- May be organized into phases for ordered execution

### Providers

- Enable communication between tasks
- Standard providers (mutable state) vs. Output providers (read-only)
- Use scopes to control visibility and prevent collisions

### TypeScript Code Generation

- `TsCodeFragment` for composable code pieces
- `TsCodeUtils` for manipulating fragments
- Import builder for managing dependencies
- Template system for code generation

## Plugin System

- Extends Baseplate with custom features, generators, and UI components
- Uses spec-implementation pattern for loose coupling
- Supports multi-platform modules (node, web, common)

## Code Structure Patterns

- Follow task-based architecture for generators
- Use provider scopes for explicit wiring
- Leverage TypeScript rendering system for code generation
- Organize complex generation with Task Phases
- Use Dynamic Tasks for data-driven generation

## Key Reminders for Claude Code

- Run `pnpm lint:affected` and `pnpm typecheck` before committing changes
- If a particular interface or type is not exported, change the file so it is exported
- If you are adding a new feature or changing an existing feature, please also add a new Changeset for it in the `.changeset/` directory of the form (keeping things to patch changes for now):

  ```markdown
  ---
  'package-name': patch
  ---

  Description of the feature or change
  ```

- IMPORTANT: If you have to go through more than two cycles of edits to fix linting, type, or test errors, please stop and ask for help. Often fixing errors will cause worse changes so it's better to ask for help than to continue. Feel free to ask for help at any time for any issues.

## Baseplate Documentation

The Baseplate documentation is available in the local filesystem at `~/baseplate-docs` (when accessible) or via the baseplate-docs MCP server.

### Local Documentation Structure (Preferred when available)

When `~/baseplate-docs` is accessible (check via `.claude/settings.json` permissions), use direct file access:

**Directory Structure:**

- `~/baseplate-docs/baseplate-docs/` - Main Baseplate documentation
  - `baseplate-architecture/` - Architecture documentation
  - `components/` - UI components documentation
  - `developer-guide/` - Developer guides
  - `internal-tooling/` - Internal tooling documentation
  - `project-builder/` - Project builder documentation
- `~/baseplate-docs/design-docs/` - Design documents
  - `completed/` - Completed design documents
  - `design-document-template.md` - Template for new design docs

**Tips for local access:**

- Read files directly with the Read tool for better performance
- Create new design docs by copying `~/baseplate-docs/design-docs/design-document-template.md`
- Use Grep/Glob tools for searching across documentation
- Write new documents directly with Write/Edit tools
- Please use Mermaid diagrams instead of ASCII art diagrams

### Baseplate Docs MCP (Fallback)

If `~/baseplate-docs` is not accessible, use the baseplate-docs MCP server:

**Collection keys:**

- **baseplate-docs**: Baseplate documentation
- **design-docs**: Design documentation

**Document Retrieval:**

- get-document - Retrieve full document content by URI (format: documents://collection-name/path/to/doc.md)
- get-document-by-id - Retrieve document by its Outline ID
- list-documents - List documents with optional filters

**Search Tools:**

- search-documents - Semantic search returning full documents
- search-rag-documents - RAG search returning specific document chunks

**Document Editing (if enabled):**

- edit-document - Replace entire document content
- inline-edit - Make specific edits within a document
- create-document - Create new document in a collection

**Usage Examples:**

- Find specific info: search-rag-documents with query "how to configure authentication"
- Browse content: list-documents with collection filter
- Read document: get-document with URI like "documents://design-docs/completed/auth-plugin-refactor.md"

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

### Common Usage Patterns

**Project Development Workflow:**

1. Use `list-templates` to see available generators and templates
2. Use `diff-project` to see what changes would be made
3. Use `sync-project` to apply changes to your project
4. Use `extract-templates` to create reusable templates from existing code

**Template Management:**

1. Use `list-templates` to see existing templates
2. Use `extract-templates` to create new templates from project code
3. Use `generate-templates` to create typed template files
4. Use `delete-template` with file paths to remove templates that are no longer needed

## Baseplate Development Workflow

This section documents the complete workflow for developing new generated code changes in Baseplate, incorporating MCP commands and modern snapshot-based approaches.

### Prerequisites

- Baseplate repository checked out locally with example projects in the `examples/` directory:
  - `examples/blog-with-auth` - Blog application with authentication
  - `examples/todo-with-auth0` - Todo application with Auth0 integration
- MCP server configured and running

### Development Workflow Overview

The Baseplate development process follows a "code-first" approach where you:

1. Make changes directly in working codebases
2. Extract those changes into reusable templates
3. Update generators to use the new templates
4. Validate and sync the generated code

### Step-by-Step Development Process

#### 1. Setup

```bash
# Create feature branch for your work
git checkout -b feature/your-feature-name
```

#### 2. Code Development

Make your changes in the appropriate example project (e.g., `examples/blog-with-auth`):

```bash
cd examples/blog-with-auth

# Make your code changes (e.g., update local auth, add features)
# Edit files as needed...

# Validate changes work
pnpm build && pnpm lint
```

#### 3. Template Metadata Management (Optional)

**For most cases: Skip this step!** Template metadata is automatically preserved when you modify existing template files.

Only manage template metadata when:

- **Creating brand new template files** (not modifying existing ones)
- **Changing fundamental template properties** (name, generator, type, variables for text templates only)
- **Removing template files completely**

**Check existing metadata first:**

```javascript
// See what template metadata exists for a file
mcp__baseplate_dev_server__show_template_metadata({
  filePath: 'src/components/my-component.tsx',
  project: 'blog-with-auth',
});
```

**Only configure metadata when needed:**

```javascript
// For NEW TypeScript templates
mcp__baseplate_dev_server__configure_ts_template({
  filePath: 'src/components/brand-new-component.tsx',
  generator: '@baseplate-dev/react-generators#core/react',
  templateName: 'brand-new-component',
  project: 'blog-with-auth',
});

// For NEW text templates with variables
mcp__baseplate_dev_server__configure_text_template({
  filePath: 'src/config/new-config.json',
  generator: '@baseplate-dev/core-generators',
  templateName: 'new-config',
  variables: { appName: { value: 'MyApp' } },
  project: 'blog-with-auth',
});

// For NEW raw/binary templates
mcp__baseplate_dev_server__configure_raw_template({
  filePath: 'public/new-icon.ico',
  generator: '@baseplate-dev/core-generators',
  templateName: 'new-icon',
  project: 'blog-with-auth',
});
```

**Delete template completely:**

```javascript
mcp__baseplate_dev_server__delete_template({
  filePath: 'src/components/old-component.tsx',
  project: 'blog-with-auth',
});
```

**Remember:** If you're just adding JSDoc, fixing bugs, or making improvements to existing template files, you can skip this entire step!

#### 4. Template Extraction

Extract templates from your working codebase using MCP commands:

```javascript
// Extract templates for the modified app
mcp__baseplate_dev_server__extract_templates({
  project: 'blog-with-auth',
  app: 'backend',
});
```

This updates the local generator templates based on your code changes.

#### 5. Generator Updates

Back in the root of the repository:

```bash
cd ../../  # Return to repository root

# Fix any type errors from added/removed variables and templates
pnpm typecheck

# Update generator configurations, schemas, and UI as needed
# - Wire up new variables in compilers
# - Update schemas in project-builder-web or plugins
# - Add/remove generator logic as needed

# Validate changes
pnpm build && pnpm lint
```

#### 6. Diff Validation

Check for differences between written and generated code:

```javascript
// Check what changes would be made
mcp__baseplate_dev_server__diff_project({
  project: 'blog-with-auth',
  packages: ['backend'],
});
```

#### 7. Handle Differences

Analyze the diff results:

- **Acceptable differences** (import aliases, minor formatting): Can be ignored
- **Significant differences**: Update generators to match written code
- **Mixed scenarios**: Use snapshot system for intentional differences

For files with intentional differences that should be preserved:

```javascript
// Save snapshot of intentional differences
mcp__baseplate_dev_server__snapshot_add({
  project: 'blog-with-auth',
  app: 'backend',
  files: ['src/specific-file.ts'],
});

// For removed files that should stay removed
mcp__baseplate_dev_server__snapshot_add({
  project: 'blog-with-auth',
  app: 'backend',
  files: ['src/removed-file.ts'],
  deleted: true,
});
```

#### 8. Code Synchronization

Once diffs are acceptable, synchronize the working codebase:

```javascript
// Overwrite working code with generated code
mcp__baseplate_dev_server__sync_project({
  project: 'blog-with-auth',
  overwrite: true,
});
```

For more targeted updates:

```bash
# Sync only specific files
baseplate sync blog-with-auth --overwrite --only-files "src/file1.ts,src/file2.ts"
```

#### 9. Final Validation

```javascript
// Run final diff to ensure no unexpected changes
mcp__baseplate_dev_server__diff_project({
  project: 'blog-with-auth',
  packages: ['backend'],
});
```

The diff should show no changes or only expected/snapshotted differences.

#### 10. Commit Changes

```bash
# Commit all changes (generators, examples, and templates)
git add .
git commit -m "feat: implement [feature description]"
```

### Advanced Workflows

#### Snapshot Management

For complex scenarios with intentional differences:

```javascript
// View current snapshot status
mcp__baseplate_dev_server__snapshot_show({
  project: 'blog-with-auth',
  app: 'backend',
});

// Remove files from snapshot (let them be generated normally)
mcp__baseplate_dev_server__snapshot_remove({
  project: 'blog-with-auth',
  app: 'backend',
  files: ['src/file.ts'],
});

// Save complete snapshot (overwrites existing)
mcp__baseplate_dev_server__snapshot_save({
  project: 'blog-with-auth',
  app: 'backend',
  force: true,
});
```

#### Template Management During Development

```javascript
// List current templates to understand what's available
mcp__baseplate_dev_server__list_templates({
  project: 'blog-with-auth',
});

// Generate template files after manual extractor.json changes
mcp__baseplate_dev_server__generate_templates({
  project: 'blog-with-auth',
});

// Remove outdated templates
mcp__baseplate_dev_server__delete_template({
  filePath: 'src/outdated-file.ts',
  project: 'blog-with-auth',
});
```

### Troubleshooting Common Issues

#### Type Errors After Template Extraction

- Check that all template variables are properly defined in generators
- Ensure import providers are correctly configured
- Run `pnpm typecheck` to identify specific issues

#### Diff Conflicts

- Use `mcp__baseplate_dev_server__snapshot_add` to add resolved files to snapshot
- For manual conflicts, edit files and re-add to snapshot using the MCP action
- Consider if differences indicate generator bugs vs. intentional customizations

#### Import Alias Differences

- Often acceptable (e.g., `../components/button.ts` vs `@src/components/button.ts`)
- Use snapshots if these differences are intentional and should be preserved
- Update generators if aliases should be standardized

### Best Practices

1. **Start with working code**: Always develop features in a concrete codebase first
2. **Use snapshots judiciously**: Only for intentional differences, not generator bugs
3. **Validate frequently**: Run diff commands often during development
4. **Test generated code**: Ensure `pnpm build && pnpm lint` passes on synced code
5. **Keep commits focused**: Separate generator changes from template changes when possible
6. **Document template variables**: Use clear, descriptive names for template variables
