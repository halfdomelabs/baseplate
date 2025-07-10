---
'@baseplate-dev/core-generators': patch
---

Add template renderers for text and raw templates

This adds corresponding template renderers for text and raw templates, following the same pattern as TypeScript template renderers. The new renderers provide consistent APIs for generating template rendering functions that can be used in generator code.

Key features:

- Text template renderers support both individual templates and template groups
- Raw template renderers support individual templates (no groups needed)
- Full TypeScript type safety with proper action input types
- Integration with the template renderers plugin system
- Consistent API design across all template types (TypeScript, text, raw)

The renderers are automatically integrated with their respective file extractors and will be available for use in generated code.
