---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-web': patch
---

Form field descriptions and error messages are now announced by screen readers, radio and multi-switch groups get accessible names, and every field accepts an `id` and `aria-describedby` — including the file upload and icon picker fields, which previously associated nothing. The unused `FormItem`/`FormControl`/`useFormField` primitives have been removed from `@baseplate-dev/ui-components`.
