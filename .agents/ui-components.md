## UI Components Quick Reference

The `@baseplate-dev/ui-components` package provides 52+ production-ready components. Import components like:

```typescript
import { Button, Input, Card, Dialog } from '@baseplate-dev/ui-components';
```

### Basic Components

- **Alert** - Status/notification messages with variants (default, destructive, warning, success)
- **Badge** - Status indicators and labels with semantic colors
- **Button** - Primary action elements (default, destructive, outline, secondary, ghost, link)
- **Button Group** - Grouped button layouts for related actions
- **Card** - Content containers with optional header/footer
- **Label** - Accessible form labels with proper associations
- **Separator** - Visual dividers (horizontal/vertical)
- **Loader** - Loading indicators with spinner animation
- **Circular Progress** - Progress indicators with percentage display

### Form Components

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
- **Form Action Bar** - Consistent form action buttons (Save, Cancel, etc.)

### Layout Components

- **Sidebar Layout** - App layout with collapsible sidebar and main content
- **Section List** - Organized content sections with headers
- **Record View** - Display data records in consistent format
- **Table** - Data tables with sorting, filtering, and pagination
- **Tabs** - Tabbed content areas with keyboard navigation
- **Navigation Menu** - App navigation with nested menu support
- **Navigation Tabs** - Tab-based navigation for page sections
- **Breadcrumb** - Navigation breadcrumbs with separator customization
- **Scroll Area** - Custom scrollable areas with styled scrollbars

### Interactive Components

- **Dialog** - Modal dialogs with overlay and focus management
- **Sheet** - Slide-out panels from any side (top, right, bottom, left)
- **Popover** - Floating content positioned relative to trigger
- **Dropdown** - Dropdown menus with keyboard navigation
- **Command** - Command palette interface with search and shortcuts
- **Tooltip** - Hover information with directional positioning
- **Confirm Dialog** - Confirmation dialogs for destructive actions
- **Calendar** - Date calendar widget with selection ranges
- **Toaster** - Toast notifications with auto-dismiss

### Display Components

- **Empty Display** - Empty state messaging with illustration and actions
- **Error Display** - Error state messaging with retry functionality
- **Errorable Loader** - Loading states with error handling

### Component Usage Patterns

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

### Visual Regression Checks (Local Only)

When refactoring component styling, capture every story before and after and diff the two
folders. This is on-demand and local: nothing is committed, no baselines exist, and no CI
workflow runs it. Both captures must come from the same machine with the same flags, since
screenshots are platform-specific.

One-time setup: `pnpm exec playwright install chromium`

```sh
# on main (or a worktree of main)
pnpm --filter @baseplate-dev/ui-components storybook:snap -- --out /tmp/fields-before

# on the branch
pnpm --filter @baseplate-dev/ui-components storybook:snap -- --out /tmp/fields-after

pnpm --filter @baseplate-dev/ui-components storybook:snap:diff -- \
  /tmp/fields-before /tmp/fields-after --open
```

The diff prints changed / added / removed story ids, exits 1 if any differ, and writes
`report.html` into the after folder. Attach that report (or the changed-story PNGs) to the PR
as the evidence for the visual pass. For a pure refactor the expected result is zero changed
stories.

The report is the review surface, not just a summary: it offers side-by-side, diff overlay,
onion skin and blink comparison, with `j`/`k` to move between stories and `/` to filter.
Onion skin and blink are what reveal a small shift — the red diff mask only shows where it
is. Pass `--inline` to embed the images so the report is a single shareable file.

Useful flags: `--grep <pattern>` limits capture to matching story ids or titles
(`--grep Field` for a field refactor); `--theme dark` captures the dark palette;
`--tolerance <n>` sets how many differing pixels a story may have before it counts as
changed (absolute, default 20, to absorb antialiasing without hiding a 2px gap change).

Three limitations worth knowing:

- **Overlays are only captured when the story opens them.** Dialogs, popovers, tooltips and
  sheets render into `document.body`; the capture unions that content with `#storybook-root`,
  so an open overlay is captured in full. But a story that only renders a trigger captures the
  trigger — nothing opens it. To cover an overlay, give it a story with `defaultOpen`, which
  is declarative and therefore deterministic. Toasts are fired imperatively and auto-dismiss,
  so they need their duration pinned in the story before a screenshot means anything.
- **A story that never holds still must opt out.** Tag it `tags: ['no-snapshot']` and the
  capture skips it. This is for stories driven by a timer or random data, which render a
  different frame on every run without changing size, so no settling can make them
  comparable — `CircularProgress`'s `AnimatedProgress` is the existing example. Do not reach
  for it to silence a diff you simply have not explained.
- **Story ids are the join key.** Renaming a story reports it as one removed plus one added,
  with no pixel comparison between them.

Field components share a canonical seven-state matrix — `Default`, `WithLabel`,
`WithDescription`, `DescriptionWithoutLabel`, `WithError`, `ErrorOnly`, `Disabled` — built
from `createFieldStates` in `src/stories/field-states.ts`. Keep those names identical across
components so a diff of a field refactor stays readable, and put base args in `meta.args`.
