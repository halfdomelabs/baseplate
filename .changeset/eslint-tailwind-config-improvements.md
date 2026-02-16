---
'@baseplate-dev/tools': patch
---

Add eslint-plugin-better-tailwindcss for Tailwind correctness linting and improve ESLint config API

- Add `eslint-plugin-better-tailwindcss` with `correctness` preset for linting Tailwind class conflicts, duplicates, and invalid classes
- Keep `prettier-plugin-tailwindcss` for formatting (class ordering, line breaks)
- Create `defineReactEslintConfig()` high-level API with `dirname`, `includeStorybook`, `tailwindEntryPoint`, and `ignores` options
- Create `defineNodeEslintConfig()` high-level API with `dirname`, `extraDefaultProjectFiles`, and `ignores` options
- Update `generateTypescriptEslintConfig()` to accept single options object with `rootDir` for `tsconfigRootDir` support
- Rename `storybookTypescriptEslintOptions` to `storybookTypescriptExtraDevDependencies` for clarity
- Remove all default exports from ESLint configs to require explicit `dirname` parameter
