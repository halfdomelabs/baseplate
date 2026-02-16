---
'@baseplate-dev/tools': patch
'@baseplate-dev/core-generators': patch
---

Add eslint-plugin-better-tailwindcss for Tailwind correctness linting and improve ESLint config API

**Monorepo packages:**
- Add `eslint-plugin-better-tailwindcss` with `correctness` preset for linting Tailwind class conflicts, duplicates, and invalid classes
- Keep `prettier-plugin-tailwindcss` for formatting (class ordering, line breaks)
- Create `defineReactEslintConfig()` high-level API with `dirname`, `includeStorybook`, `tailwindEntryPoint`, and `ignores` options
- Create `defineNodeEslintConfig()` high-level API with `dirname`, `extraDefaultProjectFiles`, and `ignores` options
- Update `generateTypescriptEslintConfig()` to accept single options object with `rootDir` for `tsconfigRootDir` support
- Rename `storybookTypescriptEslintOptions` to `storybookTypescriptExtraDevDependencies` for clarity
- Remove all default exports from ESLint configs to require explicit `dirname` parameter

**Generated projects:**
- Add `eslint-plugin-better-tailwindcss` and `tailwindcss` as dev dependencies for React apps
- Add Tailwind correctness linting to generated React ESLint configs
- Add `tsconfigRootDir: import.meta.dirname` to all generated ESLint configs for better TypeScript support
