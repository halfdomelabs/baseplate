---
'@baseplate-dev/core-generators': patch
---

Extracting a template whose templated expression Prettier wrapped in parentheses no longer drops the closing parenthesis, which previously produced an unparseable template and failed extraction.
