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
