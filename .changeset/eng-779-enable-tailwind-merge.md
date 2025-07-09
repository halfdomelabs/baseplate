---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Enable tailwind-merge in cn utility by default

Updated the cn utility function to use tailwind-merge for better class merging behavior. This change:

- Adds tailwind-merge dependency to ui-components and react-generators packages
- Updates cn function to use twMerge(clsx(inputs)) instead of just clsx(inputs)
- Simplifies input styling by removing unnecessary rightPadding variant
- Improves class conflict resolution in component styling
