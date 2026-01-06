---
name: Add Plugin
description: Step-by-step workflow for creating a new Baseplate plugin package, including root configuration files, source structure, and platform modules.
---

# Add Plugin Skill

Use this skill when creating a new Baseplate plugin package from scratch.

## Overview

This skill guides you through creating a new plugin by copying `plugin-queue` as a template and customizing it. Plugins support two architectures:

1. **Standalone plugins** - Single plugin without implementations (simpler)
2. **Spec-implementation plugins** - Base plugin + multiple implementation plugins (like auth, queue)

## Prerequisites

- User should know the plugin name (e.g., "email", "cache", "payment")
- User should know if they need spec-implementation pattern or standalone

## Phase 1: Copy Template and Create Root Files

### Step 1.1: Copy plugin-queue as template

```bash
cp -r plugins/plugin-queue plugins/plugin-<name>
```

### Step 1.2: Update package.json

Edit `plugins/plugin-<name>/package.json`:
- Change `"name"` to `"@baseplate-dev/plugin-<name>"`
- Update `"description"`
- Set `"version"` to `"0.1.0"`
- Update `"keywords"` to match the new plugin

### Step 1.3: Update vite.config.ts

Change the federation name:
```typescript
federation({
  name: 'plugin-<name>',  // <-- Update this
  filename: 'remoteEntry.js',
  ...
})
```

### Step 1.4: Update README.md

Replace content with appropriate description for the new plugin.

### Step 1.5: Clear CHANGELOG.md

Create a fresh changelog:
```markdown
# @baseplate-dev/plugin-<name>
```

### Step 1.6: Sync workspace metadata

Run from the repository root to auto-configure `tsconfig.build.json` references:
```bash
pnpm metadata:sync
```

This command automatically updates TypeScript project references based on package dependencies.

---

## CRITICAL CHECKPOINT: Restart Watch Process

**STOP HERE and inform the user:**

> The new plugin directory has been created. Before continuing:
>
> 1. **Run `pnpm install`** to register the new package in the workspace
> 2. **Restart your watch process** (`pnpm watch` or similar) to pick up the new plugin
> 3. The pnpm workspace needs to recognize `plugins/plugin-<name>` before we can continue
>
> Once you've restarted the watch process, let me know and we'll continue with the src/ customization.

**Do NOT proceed until user confirms they have restarted the watch process.**

---

## Phase 2: Customize Source Structure

### Step 2.1: Clean up src/ directory

Remove the template implementation directories (we'll create fresh ones):
```bash
rm -rf plugins/plugin-<name>/src/queue
rm -rf plugins/plugin-<name>/src/pg-boss
rm -rf plugins/plugin-<name>/src/bullmq
rm -rf plugins/plugin-<name>/src/common
```

### Step 2.2: Create base plugin directory

```bash
mkdir -p plugins/plugin-<name>/src/<plugin-name>/core
mkdir -p plugins/plugin-<name>/src/<plugin-name>/core/schema
mkdir -p plugins/plugin-<name>/src/<plugin-name>/core/components
mkdir -p plugins/plugin-<name>/src/<plugin-name>/core/generators
mkdir -p plugins/plugin-<name>/src/<plugin-name>/static
```

### Step 2.3: Update styles.css

Update the CSS prefix in `plugins/plugin-<name>/src/styles.css`:
```css
@layer theme, base, components, utilities;

@import 'tailwindcss/theme.css' layer(theme) prefix(<plugin-name>);
@import 'tailwindcss/utilities.css' layer(utilities) prefix(<plugin-name>);

@import '@baseplate-dev/ui-components/theme.css';
```

### Step 2.4: Update src/index.ts

Create exports for your plugin:
```typescript
export * from './<plugin-name>/index.js';
```

### Step 2.5: Create plugin.json

Create `plugins/plugin-<name>/src/<plugin-name>/plugin.json`:
```json
{
  "name": "<plugin-name>",
  "displayName": "<Plugin Display Name>",
  "icon": "icon.svg",
  "description": "Description of what this plugin does",
  "version": "0.1.0",
  "moduleDirectories": ["core"]
}
```

### Step 2.6: Add static icon

Create or copy an SVG icon to `plugins/plugin-<name>/src/<plugin-name>/static/icon.svg`

### Step 2.7: Create core module files

**common.ts** - Schema registration:
```typescript
import {
  createPlatformPluginExport,
  pluginConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { create<PluginName>PluginDefinitionSchema } from './schema/plugin-definition.js';

export default createPlatformPluginExport({
  dependencies: {
    config: pluginConfigSpec,
  },
  exports: {},
  initialize: ({ config }, { pluginKey }) => {
    config.registerSchemaCreator(pluginKey, create<PluginName>PluginDefinitionSchema);
    return {};
  },
});
```

**web.ts** - UI registration:
```typescript
import {
  createPlatformPluginExport,
  webConfigSpec,
} from '@baseplate-dev/project-builder-lib';

import { <PluginName>DefinitionEditor } from './components/<plugin-name>-definition-editor.js';

export default createPlatformPluginExport({
  dependencies: {
    webConfig: webConfigSpec,
  },
  exports: {},
  initialize: ({ webConfig }, { pluginKey }) => {
    webConfig.registerWebConfigComponent(pluginKey, <PluginName>DefinitionEditor);
    return {};
  },
});
```

**node.ts** - Generator registration:
```typescript
import {
  appCompilerSpec,
  backendAppEntryType,
  createPlatformPluginExport,
} from '@baseplate-dev/project-builder-lib';

import { <pluginName>Generator } from './generators/<plugin-name>/<plugin-name>.generator.js';

export default createPlatformPluginExport({
  dependencies: {
    appCompiler: appCompilerSpec,
  },
  exports: {},
  initialize: ({ appCompiler }, { pluginKey }) => {
    appCompiler.registerAppCompiler({
      pluginKey,
      appType: backendAppEntryType,
      compile: ({ appCompiler }) => {
        appCompiler.addRootChildren({
          <pluginName>: <pluginName>Generator({}),
        });
      },
    });
    return {};
  },
});
```

**index.ts** - Barrel exports:
```typescript
export * from './core/index.js';
```

**core/index.ts**:
```typescript
// Re-export schema types
export type * from './schema/plugin-definition.js';
```

### Step 2.8: Create schema

Create `plugins/plugin-<name>/src/<plugin-name>/core/schema/plugin-definition.ts`:
```typescript
import { definitionSchema } from '@baseplate-dev/project-builder-lib';
import { z } from 'zod';

export const create<PluginName>PluginDefinitionSchema = definitionSchema(() =>
  z.object({
    // Add your plugin configuration fields here
    // For spec-implementation pattern:
    // implementationPluginKey: z.string().min(1, 'Implementation must be selected'),
  }),
);

export type <PluginName>PluginDefinition = z.infer<
  ReturnType<typeof create<PluginName>PluginDefinitionSchema>
>;
```

### Step 2.9: Create UI component

Create `plugins/plugin-<name>/src/<plugin-name>/core/components/<plugin-name>-definition-editor.tsx`:
```typescript
import type { WebConfigProps } from '@baseplate-dev/project-builder-lib';
import {
  useProjectDefinition,
  useResettableForm,
} from '@baseplate-dev/project-builder-lib/web';
import { Button } from '@baseplate-dev/ui-components';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

import {
  create<PluginName>PluginDefinitionSchema,
  type <PluginName>PluginDefinition,
} from '../schema/plugin-definition.js';

export function <PluginName>DefinitionEditor({
  definition: pluginMetadata,
  metadata,
  onSave,
}: WebConfigProps): React.ReactElement {
  const { saveDefinitionWithFeedback } = useProjectDefinition();

  const schema = create<PluginName>PluginDefinitionSchema();

  const form = useResettableForm<<PluginName>PluginDefinition>({
    resolver: zodResolver(schema),
    values: pluginMetadata?.config as <PluginName>PluginDefinition,
  });

  const onSubmit = form.handleSubmit((data) =>
    saveDefinitionWithFeedback(
      (draftConfig) => {
        // Update plugin config
      },
      {
        successMessage: 'Plugin settings saved!',
        onSuccess: () => onSave(),
      },
    ),
  );

  return (
    <form onSubmit={onSubmit} className="<plugin-name>:space-y-4 <plugin-name>:max-w-4xl">
      {/* Add form fields here */}

      <Button type="submit" disabled={form.formState.isSubmitting}>
        Save
      </Button>
    </form>
  );
}
```

**IMPORTANT**: All CSS classes must use the `<plugin-name>:` prefix (e.g., `<plugin-name>:flex`, `<plugin-name>:space-y-4`).

---

## Phase 3: For Spec-Implementation Plugins Only

Skip this phase for standalone plugins.

### Step 3.1: Create implementation directory

```bash
mkdir -p plugins/plugin-<name>/src/<implementation-name>/core
mkdir -p plugins/plugin-<name>/src/<implementation-name>/core/schema
mkdir -p plugins/plugin-<name>/src/<implementation-name>/core/components
mkdir -p plugins/plugin-<name>/src/<implementation-name>/core/generators
mkdir -p plugins/plugin-<name>/src/<implementation-name>/static
```

### Step 3.2: Create implementation plugin.json

Create `plugins/plugin-<name>/src/<implementation-name>/plugin.json`:
```json
{
  "name": "<implementation-name>",
  "displayName": "<Implementation Display Name>",
  "icon": "icon.svg",
  "description": "Description of this specific implementation",
  "version": "0.1.0",
  "moduleDirectories": ["core"],
  "managedBy": "@baseplate-dev/plugin-<name>:<plugin-name>"
}
```

The `managedBy` field links this implementation to the base plugin.

### Step 3.3: Create implementation modules

Follow the same pattern as the base plugin, but with implementation-specific logic.

### Step 3.4: Update src/index.ts

Add exports for each implementation:
```typescript
export * from './<plugin-name>/index.js';
export type * from './<implementation-name>/index.js';
```

---

## Phase 4: Build and Verify

### Step 4.1: Install dependencies

```bash
pnpm install
```

### Step 4.2: Build the plugin

```bash
cd plugins/plugin-<name>
pnpm build
```

### Step 4.3: Type check

```bash
pnpm typecheck
```

### Step 4.4: Lint

```bash
pnpm lint --fix
```

---

## Troubleshooting

### Plugin not discovered
- Ensure `plugin.json` exists in each plugin directory
- Check that `moduleDirectories` points to valid directories with module files
- Verify the package is in `pnpm-workspace.yaml` scope (`plugins/*`)

### CSS not applying
- Check that all classes use the `<plugin-name>:` prefix
- Verify `styles.css` has the correct prefix configuration

### Module federation errors
- Ensure `vite.config.ts` has the correct federation name
- Check that all shared dependencies match the host application

### Type errors
- Run `pnpm typecheck` to identify issues
- Ensure all imports use `.js` extensions for ESM compatibility

## Best Practices

1. **Use meaningful names** - Plugin names should clearly indicate functionality
2. **Follow the CSS prefix convention** - All Tailwind classes must be prefixed
3. **Export types properly** - Use `export type *` for type-only exports
4. **Keep generators modular** - Create separate generators for distinct features
5. **Document your plugin** - Update README.md with usage instructions
