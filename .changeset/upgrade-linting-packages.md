---
'@baseplate-dev/tools': patch
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Upgrade linting packages

**Major version bumps:**
- eslint: 9.32.0 → 9.39.2
- @eslint/js: 9.32.0 → 9.39.2
- eslint-plugin-perfectionist: 4.15.0 → 5.4.0
- eslint-plugin-react-hooks: 5.2.0 → 7.0.1
- eslint-plugin-unicorn: 60.0.0 → 62.0.0
- globals: 16.4.0 → 17.3.0
- prettier-plugin-packagejson: 2.5.19 → 3.0.0
- storybook: 10.1.10 → 10.2.8

**Minor/patch bumps:**
- @vitest/eslint-plugin: 1.3.4 → 1.6.6 (tools), 1.6.5 → 1.6.6 (core-generators)
- eslint-plugin-storybook: 10.1.10 → 10.2.3
- prettier-plugin-tailwindcss: 0.6.14 → 0.7.2
- typescript-eslint: 8.38.0 → 8.54.0
- @types/eslint-plugin-jsx-a11y: 6.10.0 → 6.10.1

**Config changes:**
- Updated eslint-plugin-react-hooks v7 API: `configs['recommended-latest']` → `configs.flat['recommended-latest']`
