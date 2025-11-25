---
'@baseplate-dev/utils': patch
---

Add stable compareStrings utility to replace localeCompare for deterministic sorting. The new compareStrings function provides consistent, locale-independent string comparison across all operating systems and environments, ensuring stable code generation and preventing merge conflicts caused by locale-dependent sorting.
