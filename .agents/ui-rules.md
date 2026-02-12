## UI Development Guidelines

- **Component Library**: Use ShadCN-based components from `@baseplate-dev/ui-components`
  - This package contains a customized variation of ShadCN components
  - Always prefer these components over creating custom ones
- **Styling**: Use Tailwind CSS utilities exclusively
  - Avoid writing custom CSS classes
  - Use Tailwind's utility classes for all styling needs
  - In plugins, prefix all Tailwind classes with the plugin name (e.g., `auth-`, `storage-`)
- **Icons**: Use icons from `react-icons/md` (Material Design icons)
  - Import icons like: `import { MdAdd, MdDelete } from 'react-icons/md'`
  - Avoid using other icon libraries (lucide-react, heroicons, etc.)
  - If a specific icon is not available in `react-icons/md`, consult before using alternatives.
