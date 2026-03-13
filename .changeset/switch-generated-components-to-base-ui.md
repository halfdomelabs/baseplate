---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/plugin-storage': patch
---

Switch generated UI components from radix-ui to @base-ui/react

- Replace radix-ui and cmdk dependencies with @base-ui/react in generated projects
- Update all generator templates to use base-ui component implementations
- Convert asChild prop usage to render prop pattern in admin layout, crud list, and crud edit action generators
- Update plugin-storage upload component templates to use Field/FieldError instead of FormItem/FormMessage
