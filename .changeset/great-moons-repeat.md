---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Rendered markdown and HTML now get their typography from a `typeset` class that sizes to its container, replacing the global `h1`-`h3`/`p` rules and the `text-style-*` utilities, so headings outside `typeset` need their own text utilities. A new `PageHeader` covers page titles, a `link` utility gives links outside rendered content the same styling `typeset` gives links inside it, and generated card components now also export `CardAction`.
