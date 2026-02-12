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
- **Form Item** - Wrapper for form fields with label, description, error
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
