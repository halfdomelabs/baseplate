---
'@baseplate-dev/react-generators': patch
---

Generated apps no longer install `tailwind-merge` when their components come from a shared component library, and generated component libraries no longer install the unused `@hookform/resolvers` dependency.
