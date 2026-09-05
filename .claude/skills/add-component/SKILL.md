---
name: add-component
description: Workflow for adding a new UI component to ui-components (with Storybook + optional tests) and optionally to the react-generators template system.
---

# Add Component Skill

Use this skill when adding a new UI component to Baseplate. The workflow covers:

1. Determining the component's source (shadcn/base-ui, existing code, or custom)
2. Implementing it in `packages/ui-components` with stories and optional tests
3. Pausing for user review
4. Optionally integrating it into the react-generators template system

---

## Phase 1: Source Decision

Before writing any code, determine where the component comes from. If the user hasn't specified, ask:

- What is the component name?
- Is it from shadcn/ui, another library, or a custom component?
- Does it have complex logic (stateful behavior, async, keyboard handling)?

**Decision tree:**

- **shadcn/ui component** → Check if shadcn has a **base-ui variant** of the component first (URL pattern: `https://ui.shadcn.com/docs/components/base/<name>`). If yes, use that — `@base-ui/react` is already a dependency. If only a Radix variant exists (`/docs/components/radix/<name>`), use that instead. Note the shadcn URL in a JSDoc comment.
- **Existing component with source code** → Adapt from the provided code.
- **Custom/new component** → Build from scratch in ui-components.

---

## Phase 2: Implement in ui-components

### Files to create

```
packages/ui-components/src/components/ui/<component-name>/
├── <component-name>.tsx            # Component implementation
└── <component-name>.stories.tsx    # Storybook stories
# Add if complex logic exists:
└── <component-name>.unit.test.tsx  # Unit tests
```

### Adaptation rules

1. **cn import**: `import { cn } from '#src/utils/index.js';`
2. **Return types**: All top-level functions must have `: React.ReactElement` return type
3. **data-slot attributes**: Keep `data-slot` attributes exactly as they come from shadcn source. Only add `data-slot` when building a custom component from scratch.
4. **File extensions**: All relative imports must use `.js` extensions (ES module requirement)
5. **shadcn source link**: Add a JSDoc comment referencing the original, e.g.:
   ```typescript
   /**
    * A responsive table component.
    *
    * https://ui.shadcn.com/docs/components/base/table
    */
   ```
6. **Styling/functionality differences**: If you deviate from the shadcn default, document it in the component's JSDoc under a `ShadCN changes:` heading, one bullet per deviation. A deviation with no bullet is indistinguishable from drift the next time the component is swept against upstream. Where a component diverges structurally rather than line by line (`input-otp`, `sidebar`, `button-group`), one bullet naming the divergence is enough.

   These deviations are library-wide and need no per-component bullet: the JSDoc block itself, `: React.ReactElement` return types, alphabetically sorted exports (a lint rule), `react-icons/md` instead of `lucide-react`, and `interface` over `type`.

7. **Imports from other ui-components**: Use the component's folder-relative path, e.g.:
   ```typescript
   import { Button } from '../button/button.js';
   ```
8. **Imports from hooks**: Use the `#src/` alias, e.g.:
   ```typescript
   import { useConfirmDialog } from '#src/hooks/use-confirm-dialog.js';
   ```
9. **New npm dependencies**: If the component requires a new package not already in `packages/ui-components/package.json`, add it with `pnpm --filter @baseplate-dev/ui-components add <package>`.
10. **Colours come from tokens**: never a literal (`bg-white`, `bg-black/10`, hex, `hsl()`). Status colours use the `tone-*` utilities. A control's fill is `bg-control-background`, which flips with the surface underneath it; something that must punch back through a control-coloured fill uses `bg-panel-background`. Never define a repeated style as an `@apply` class — repeated styles stay inline utilities, and a repeated _role_ becomes a component.
11. **Logical utilities**: prefer `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start` in new code. Do not mass-convert existing components; if RTL ever becomes a project-definition option it should be a `code-morph` transform at generation time, following shadcn's `migrate rtl`, not a rewrite of the library.
12. **Interactive controls take a `size` prop**, defaulted through `useControlSize()` rather than hardcoded heights. (Lands with ENG-1306; until then, follow the existing `size` variants on `Button` and `Select`.)
13. **Empty values in field controllers**: A `*FieldController` built on `useControllerMerged` must normalize `value` to the empty representation of its type — `null` for nullable scalars, `[]` for lists, `false` for booleans — never leaving it `undefined`, e.g. `value={field.value ?? null}`. See the Empty-Value Convention section in `packages/ui-components/README.md`.

### Story file pattern

```typescript
import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComponentName } from './component-name.js';

const meta = {
  title: 'components/ComponentName',
  component: ComponentName,
  tags: ['autodocs'],
  argTypes: {
    // Add interactive controls for key props
  },
} satisfies Meta<typeof ComponentName>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    // Provide sensible defaults
  },
};
// Add more story variants for different states/variants
```

### When to add unit tests

Add a `<component-name>.unit.test.tsx` only when the component has:

- Internal state or complex conditional rendering
- Async operations or debounced behavior
- Non-trivial keyboard or accessibility interactions
- Logic beyond className merging or prop forwarding

Use `renderWithProviders` from `#src/tests/render.test-helper.js`, not raw `render`:

```typescript
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '#src/tests/render.test-helper.js';
import { ComponentName } from './component-name.js';

describe('ComponentName', () => {
  it('should ...', () => {
    renderWithProviders(<ComponentName ... />);
    // assertions
  });
});
```

### Keep the twin in sync

`packages/react-generators` ships a copy of most of these components as generator
templates, and `component-twins.unit.test.ts` fails if the two drift. You never
edit the template directly — Phase 4 regenerates it from the example app — but
after any change to a shared component run:

```bash
pnpm --filter @baseplate-dev/react-generators test component-twins
```

A twin that must differ goes in that test's `DEVIATIONS` list with the reason.
The list rejects entries that have stopped differing, so it cannot go stale.

### Register the export

Add to `packages/ui-components/src/components/ui/index.ts` (keep alphabetically sorted):

```typescript
export * from './<component-name>/<component-name>.js';
```

---

## Phase 3: User Review — STOP HERE

After creating the ui-components files, **stop and present**:

- The list of files created/modified
- Any notable design decisions (e.g., "used base-ui variant", "adapted from shadcn with these differences", "added dependency X")
- Ask the user whether to proceed with generator integration (Phase 4)

> Do NOT proceed to Phase 4 until the user explicitly confirms.

---

## Phase 4: Generator Integration

### 4a. Add to the blog-with-auth example apps

Apply the change to **both** `apps/admin` and `apps/app` before extracting from
either. They share templates, so extracting from one after editing only the
other reverts the other's changes. The same holds for any file every web app
carries, `src/styles.css` among them.

Create `examples/blog-with-auth/apps/<app>/src/components/ui/<component-name>.tsx` in each app, with these adaptations from the ui-components version:

1. **Single file** at `components/ui/<component-name>.tsx` (no sub-folder)
2. **cn import**: `import { cn } from '@src/utils/cn';` (the example project's path alias)
3. **Imports from other components**: Use the flat `@src/components/ui/<component-name>` alias instead of relative folder paths
4. **Imports from hooks**: Use `@src/hooks/<hook-name>` alias
5. **No `@ts-nocheck`** in the example file — the generator tooling adds it automatically during extraction
6. Keep all other logic identical to the ui-components version

Then validate the example builds:

```bash
pnpm run:example blog-with-auth -- pnpm typecheck
pnpm run:example blog-with-auth -- pnpm lint
```

### 4b. Configure the ts template via MCP

```javascript
mcp__baseplate_dev_server__configure_ts_template({
  filePath: 'src/components/ui/<component-name>.tsx',
  generator: '@baseplate-dev/react-generators#core/react-components',
  templateName: '<component-name>',
  project: 'blog-with-auth',
});
```

### 4c. Extract templates via MCP

```javascript
mcp__baseplate_dev_server__extract_templates({
  project: 'blog-with-auth',
  app: 'admin',
});
```

### 4d. Fix type errors and validate

```bash
pnpm --filter @baseplate-dev/react-generators typecheck
pnpm --filter @baseplate-dev/react-generators lint --fix
```

### 4e. Sync all projects

```javascript
mcp__baseplate_dev_server__sync_all_projects({
  overwrite: true,
});
```

### 4f. Add or update changeset

Check `.changeset/` for an existing changeset covering the same component. If found, add to it. Otherwise create `.changeset/<component-name>.md`:

```markdown
---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Add <ComponentName> component
```

---

## Reference Files

| Purpose                     | Path                                                                                               |
| --------------------------- | -------------------------------------------------------------------------------------------------- |
| ui-components barrel export | `packages/ui-components/src/components/ui/index.ts`                                                |
| ui-components test helper   | `packages/ui-components/src/tests/render.test-helper.tsx`                                          |
| Example component (table)   | `packages/ui-components/src/components/ui/table/table.tsx`                                         |
| Generator templates dir     | `packages/react-generators/src/generators/core/react-components/templates/components/ui/`          |
| Generator extractor config  | `packages/react-generators/src/generators/core/react-components/extractor.json`                    |
| Example template (table)    | `packages/react-generators/src/generators/core/react-components/templates/components/ui/table.tsx` |
| Modify generated code skill | `.claude/skills/modify-generated-code/SKILL.md`                                                    |
| Twin-drift test             | `packages/react-generators/src/generators/core/react-components/component-twins.unit.test.ts`      |
| Design token layer          | `packages/ui-components/src/theme.css`, `packages/ui-components/src/base-styles.css`               |
| Generated-app token twin    | `packages/react-generators/src/generators/core/react-tailwind/templates/src/styles.css`            |

---

## Important Notes

- Never manually edit files in `generated/` directories — they are auto-generated.
- If you hit more than two cycles of type/lint errors after extraction, stop and ask the user for help.
