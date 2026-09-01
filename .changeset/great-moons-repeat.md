---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Text size utilities now control line-height on headings and paragraphs, so a `<h1 class="text-2xl">` or `<p class="text-sm">` renders at the leading its size specifies instead of the base element's. Generated card components now also export `CardAction`, making the header's title/action two-column layout usable.
