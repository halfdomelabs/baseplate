---
'@baseplate-dev/react-generators': patch
---

Reorganize components folder structure in generated codebases

The components folder structure has been reorganized to improve organization and reduce bundle size:

**Breaking Changes:**

- Removed bundle export at `components/index.ts` to prevent importing all components at once
- Moved all UI components from `components/` to `components/ui/` folder

**New Structure:**

```
components/
├── ui/           # UI components
│   ├── button.tsx
│   ├── input.tsx
│   └── ...
└── [other-components]  # Custom application components
```

**Migration:**

- Replace `import { Button } from '@src/components'` with `import { Button } from '@src/components/ui/button'`
- Update imports to use specific component paths instead of barrel exports
- UI components are now co-located in the `ui/` subfolder for better organization

This change improves tree-shaking, reduces bundle size, and provides clearer separation between UI library components and custom application components.
