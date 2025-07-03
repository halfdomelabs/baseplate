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
- **Checkbox/Checkbox Field** - Boolean inputs
- **Switch/Switch Field** - Toggle switches
- **Combobox/Combobox Field** - Searchable select with custom options
- **Multi Combobox/Multi Combobox Field** - Multi-select with tags
- **Color Picker/Color Picker Field** - Color selection with palette
- **Date Picker Field** - Date selection with calendar
- **Date Time Picker Field** - Combined date and time selection
- **Form Item** - Form field wrapper with label/error display
- **Form Action Bar** - Consistent form action buttons

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
- **Typography**: Establishes base heading and paragraph styles
- **Global Defaults**: Sets border colors, backgrounds, and text antialiasing

### `theme.css`

Theme configuration file for Tailwind CSS integration:

- **Color Mapping**: Maps CSS variables to Tailwind color utilities
- **Dark Mode**: Configures dark mode variant with automatic detection
- **Font Configuration**: Defines font family tokens for body and monospace text
- **Animation**: Imports tw-animate-css for animation utilities

### `utilities.css`

Custom utility classes for advanced styling patterns:

- **Surface Utilities**: `surface-default`, `surface-success`, `surface-warning`, `surface-error` for contextual styling
- **Typography Utilities**: `text-style-lead`, `text-style-large`, `text-style-small`, `text-style-muted`, `text-style-prose` for consistent text styling
- Uses dynamic color mixing for muted variations and borders

## Part of Baseplate Monorepo

This package is part of the Baseplate monorepo and is used by project-builder-web as well as generated Baseplate projects.
