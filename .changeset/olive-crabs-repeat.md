---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Generated components are now caught up with current shadcn Base UI, so inputs, cards, calendars, radio groups and dialogs pick up upstream's refreshed sizing, radii and range styling, and controls fill with a new `--control-background` token that flips with the surface beneath them instead of always matching the page. Components that deliberately differ from shadcn now say so inline.
