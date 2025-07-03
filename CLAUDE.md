# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build and Test Commands

See @.cursor/rules/dev-commands.mdc for dev commands for building and testing.

## Code Style Guidelines

See @.cursor/rules/code-style.mdc for code style guidelines.

## UI Development Guidelines

See @.cursor/rules/ui-development.mdc for UI development guidelines.

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

## Baseplate Docs MCP

Please interact with the baseplate-docs MCP to get the most up to date information on the project. Here are the following tips:

Docs specific:

- Creating Design Docs: Search for the document by id "e84a9e72-9980-41f6-bdda-296736c5ff69" for the design doc template
- Please add a description when creating documents to describe the document and its purpose.
- Please use Mermaid documents instead of ASCII art diagrams.

Collection keys:

- **baseplate-docs**: Baseplate documentation
- **design-docs**: Design documentation

Document Retrieval

- get-document - Retrieve full document content by URI (format:
  documents://collection-name/path/to/doc.md)
- get-document-by-id - Retrieve document by its Outline ID
- list-documents - List documents with optional filters:
  - collectionKey - Filter by specific collection
  - prefix - Filter by subdirectory path
  - keywords - Space-separated keywords (ALL must match)

Search Tools

- search-documents - Semantic search returning full documents with
  similarity scores
- search-rag-documents - RAG search returning specific document
  chunks/passages with location info

Collection Management

- list-collections - List all available collections

Document Editing (if enabled)

- edit-document - Replace entire document content
- inline-edit - Make specific edits within a document
- create-document - Create new document in a collection

Usage Examples:

- Find specific info: search-rag-documents with query "how to configure
  authentication"
- Browse content: List-documents with collection filter if needed
- Read document: get-document with URI like
  "documents://engineering/api/auth.md"
- Quick edits: inline-edit to update specific sections
- Major updates: edit-document to rewrite entire document
