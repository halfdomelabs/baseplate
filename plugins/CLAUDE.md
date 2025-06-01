# CLAUDE.md for Plugins

This file provides guidance to Claude Code (claude.ai/code) when working with plugin code in this directory.

## CSS Class Naming Convention

All CSS classes used in `className` attributes within plugin components MUST be prefixed with the plugin name to avoid style conflicts.

### Examples:

**For plugin-auth:**

- Use: `auth:flex`, `auth:space-y-4`, `auth:bg-muted`
- Don't use: `flex`, `space-y-4`, `bg-muted`

**For plugin-storage:**

- Use: `storage:grid`, `storage:p-4`, `storage:text-center`
- Don't use: `grid`, `p-4`, `text-center`

### Pattern:

```tsx
// ✅ Good
<div className="auth:flex auth:flex-col auth:gap-4">
  <button className="auth:px-4 auth:py-2">Login</button>
</div>

// ❌ Bad
<div className="flex flex-col gap-4">
  <button className="px-4 py-2">Login</button>
</div>
```

### When using utility functions like `cn()`:

```tsx
// ✅ Good
className={cn("auth:border auth:rounded-lg", isActive && "auth:bg-primary")}

// ❌ Bad
className={cn("border rounded-lg", isActive && "bg-primary")}
```

This convention ensures that plugin styles remain isolated and don't interfere with the main application or other plugins.
