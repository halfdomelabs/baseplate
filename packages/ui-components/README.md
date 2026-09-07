# @baseplate-dev/ui-components

This package contains reusable UI components used throughout Baseplate projects and the project builder interface.

## Purpose

The ui-components package provides:

- A customized variation of ShadCN components tailored for Baseplate
- Reusable React components for both the project builder and generated projects
- Consistent design system across all Baseplate applications
- Storybook documentation for component development and testing
- Tailwind CSS-based styling system

## Technology Stack

- Built with React and TypeScript
- Styled with Tailwind CSS
- Based on ShadCN component architecture
- Includes Storybook for component documentation
- Uses Material Design icons (react-icons/md)

## Available Components

The package provides 52+ production-ready components organized into the following categories:

### Basic Components

- **Alert** - Status/notification messages with semantic variants
- **Badge** - Status indicators and labels
- **Button** - Primary action elements with comprehensive variants
- **Button Group** - Grouped button layouts
- **Card** - Content containers with header/footer support
- **Label** - Accessible form labels
- **Separator** - Visual dividers
- **Loader** - Loading indicators
- **Circular Progress** - Progress indicators with percentages

### Form Components

All form components are available in both standalone and React Hook Form integrated variants:

- **Input/Input Field** - Text inputs with validation
- **Textarea/Textarea Field** - Multi-line text areas
- **Select/Select Field** - Dropdown selections with search
- **Radio Group/Radio Field** - Single choice from visible options
- **Number Field** - Numeric input with steppers
- **Checkbox/Checkbox Field** - Boolean inputs
- **Switch/Switch Field** - Toggle switches
- **Combobox/Combobox Field** - Searchable select with custom options
- **Multi Combobox/Multi Combobox Field** - Multi-select with tags
- **Color Picker/Color Picker Field** - Color selection with palette
- **Date Picker Field** - Date selection with calendar
- **Date Time Picker Field** - Combined date and time selection
- **Form Action Bar** - Consistent form action buttons

#### Empty-Value Convention

A controlled field controller (one built on `useControllerMerged`) must never pass
`undefined` as `value` to its presentational component. At the controller boundary it
normalizes to the empty representation of its type:

| Value type                                   | Empty value | Example                        |
| -------------------------------------------- | ----------- | ------------------------------ |
| Nullable scalar (string, enum, number, date) | `null`      | `value={field.value ?? null}`  |
| List                                         | `[]`        | `value={field.value ?? []}`    |
| Boolean                                      | `false`     | `value={field.value ?? false}` |

Two reasons this matters:

1. **Clearing a field must persist.** Server mutations spread their input directly into
   the ORM, where an omitted key means "leave this column alone" and an explicit `null`
   means "set it to NULL". `JSON.stringify` drops `undefined` keys, so a controller that
   emits `undefined` turns a user clearing a field into a silent no-op.
2. **Base UI primitives switch to uncontrolled when `value` is `undefined`.** React Hook
   Form yields `undefined` for any field without a default, so normalizing at the
   controller is what keeps the input controlled from first render.

**Exception — uncontrolled text inputs.** `InputFieldController` and
`TextareaFieldController` use `register()` and emit `''` when cleared. This is a scope
decision, not a technical limit: `register(name, { setValueAs })` could map `''` to
`null` without making the input controlled, but it must be gated on nullability
(required string fields need `''` so `z.string().min(1)` reports "must contain at least
1 character" rather than a type error). Mapping empty strings to `null` for optional
string fields is tracked as follow-up work.

**Writing your own field controller.** Do not hand-edit files in `components/ui/` of a
generated app — Baseplate regenerates that directory and your changes will be
overwritten. Put custom controllers in a sibling directory (for example
`components/fields/`) and follow the convention above so they behave consistently with
the generated ones.

### Layout Components

- **Sidebar Layout** - App layout with collapsible sidebar
- **Section List** - Organized content sections
- **Record View** - Data record display
- **Table** - Data tables with sorting/filtering
- **Tabs** - Tabbed content areas
- **Navigation Menu** - App navigation with nesting
- **Navigation Tabs** - Tab-based page navigation
- **Breadcrumb** - Navigation breadcrumbs
- **Scroll Area** - Custom scrollable areas

### Interactive Components

- **Dialog** - Modal dialogs with focus management
- **Sheet** - Slide-out panels from any side
- **Popover** - Floating content positioned to triggers
- **Dropdown** - Dropdown menus with keyboard navigation
- **Command** - Command palette interface
- **Tooltip** - Hover information with positioning
- **Confirm Dialog** - Confirmation dialogs for destructive actions
- **Calendar** - Date calendar widget
- **Toaster** - Toast notifications with auto-dismiss

### Display Components

- **Empty Display** - Empty state messaging with actions
- **Error Display** - Error state messaging with retry
- **Errorable Loader** - Loading states with error handling

### Usage Example

```typescript
import {
  Button,
  Card,
  InputField,
  FormActionBar,
  useConfirmDialog,
  toast
} from '@baseplate-dev/ui-components';
import { useForm } from 'react-hook-form';

const MyForm = () => {
  const form = useForm();
  const confirmDialog = useConfirmDialog();

  const handleSubmit = async (data) => {
    const confirmed = await confirmDialog({
      title: 'Save Changes',
      description: 'Are you sure you want to save these changes?'
    });

    if (confirmed) {
      try {
        await saveData(data);
        toast.success('Changes saved successfully');
      } catch (error) {
        toast.error('Failed to save changes');
      }
    }
  };

  return (
    <Card>
      <Card.Header>
        <Card.Title>User Information</Card.Title>
      </Card.Header>
      <Card.Content>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <InputField
            control={form.control}
            name="name"
            label="Full Name"
            placeholder="Enter your name"
            rules={{ required: 'Name is required' }}
          />

          <FormActionBar>
            <Button type="submit">Save Changes</Button>
            <Button variant="outline" type="button">Cancel</Button>
          </FormActionBar>
        </form>
      </Card.Content>
    </Card>
  );
};
```

## Development & Documentation

- **Storybook**: Run `pnpm storybook:dev` for interactive component documentation
- **Built Storybook**: Available at `storybook-static/index.html`
- **Component Stories**: Each component includes comprehensive Storybook stories with examples and controls

## CSS Files

The package includes several CSS files that work together to provide theming and styling:

### Import Patterns

**For Websites (Full Styling):**

```css
/* Import all styling layers */
@import '@baseplate-dev/ui-components/base-styles.css';
@import '@baseplate-dev/ui-components/theme.css';
@import '@baseplate-dev/ui-components/utilities.css';
@import '@baseplate-dev/ui-components/typeset.css';
```

**For Plugins (Theme Only):**

```css
/* Import only the theme configuration */
@import '@baseplate-dev/ui-components/theme.css';
```

### `base-styles.css`

The main entry point for consumers that sets up the complete styling foundation:

- **CSS Variables**: Defines color tokens for light and dark themes using OKLCH color space
- **Font Setup**: Imports Geist and Geist Mono variable fonts with fallback configurations
- **Global Defaults**: Sets border colors, backgrounds, text antialiasing, and a pointer cursor on buttons

### `theme.css`

Theme configuration file for Tailwind CSS integration:

- **Color Mapping**: Maps CSS variables to Tailwind color utilities
- **Dark Mode**: Configures dark mode variant with automatic detection
- **Font Configuration**: Defines font family tokens for body, heading, and monospace text
- **Animation**: Imports tw-animate-css for animation utilities

### `utilities.css`

Custom utility classes for advanced styling patterns:

- **Tone Utilities**: `tone-default`, `tone-success`, `tone-warning`, `tone-error` for contextual styling
- **Inline Link Utility**: `inline-link` — an interactive text treatment embedded in surrounding copy: persistent underline, `--link` color, visible keyboard focus. The same treatment `typeset` gives links inside rendered content.
- Uses dynamic color mixing for muted variations and borders

### `typeset.css`

Typography for rendered content — markdown, HTML, help text, AI chat output.
A port of [shadcn/typeset](https://ui.shadcn.com/docs/typeset) reading
Baseplate's palette tokens directly. There are no base `h1`–`h3`/`p` rules: a
bare heading is unstyled, and typography is opted into.

Wrap rendered content in `typeset`; style UI chrome with plain utilities:

```tsx
<div className="typeset">{renderedMarkdown}</div>
```

- **Container-relative**: sized in `em`, so the same markup renders correctly in
  a `text-sm` card and on a full-width page with no per-context variant.
- **Rhythm variables**: `--typeset-size` (base size, `1em`), `--typeset-leading`
  (line height, `1.75`), and `--typeset-flow` (space between blocks, `1.25em`).
  Override per container with an arbitrary property:
  `<article className="typeset [--typeset-flow:1.75em]">`.
- **`not-typeset` / `data-not-typeset`**: keeps a component and everything inside
  it out of typeset. Use it for interactive components embedded in content.
- **`typeset-scroll`**: wrap a wide table (or any wide block) to scroll it
  horizontally instead of letting it compress.
- **Layering**: the file declares its own `@layer components`, so text utilities
  always win over it. Importers just `@import` it — do not add `layer(...)`.
- **Streaming-safe**: no `:last-child` or `:has()`, and spacing is
  `margin-block-start` only, so appending content never restyles what is already
  rendered.

Typeset must be imported into the same stylesheet as `theme.css`: Tailwind prunes
theme variables that nothing references, and typeset is the only consumer of
`--font-heading`.

## Theme tokens

The token layer is split across the four files above by concern:

- **Palette** (`base-styles.css`): the raw color variables (`--background`, `--foreground`, `--primary`, `--border`, etc.), grouped in `theme-colors.ts` by category — `surface` (background/card/popover/accent/success/warning/error and their foregrounds), `interactive` (primary/secondary/destructive/link), and `utility` (border/input/ring). Surface-category defaults are generated from the same palette Tailwind ships (`slate` by default); interactive/utility colors are hand-tuned brand colors independent of that palette.
- **Tailwind mapping** (`theme.css`): `@theme inline` re-exposes each palette variable as a `--color-*` token so Tailwind generates the matching utility classes (`bg-primary`, `text-foreground`, etc). `--color-*: initial` resets Tailwind's own built-in `--color-*` namespace first — deliberately, so only the tokens re-declared here (not Tailwind's default reds/blues/etc.) produce color utilities.
- **Tone utilities** (`utilities.css`): `tone-default`/`tone-success`/`tone-warning`/`tone-error` each set `--tone`, `--tone-foreground`, `--tone-border`, and `--tone-muted-foreground` to one status color's palette. Apply a tone class alongside `bg-tone`, `text-tone-foreground`, `border-tone-border`, and/or `text-tone-muted-foreground` on the element that should take on that status color — see `Alert`, `Toaster`, or `Badge`'s `success`/`warning` variants.
- **Local overrides**: a Tailwind arbitrary property (`[--x:value]`) scopes a one-off override to a single element without touching the shared tokens, e.g. `Calendar`'s `[--cell-size:--spacing(8)]`.

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and is used by project-builder-web as well as generated Baseplate projects.
