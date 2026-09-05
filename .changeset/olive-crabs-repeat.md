---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Generated components are now caught up with current shadcn Base UI, so inputs, cards, calendars, radio groups and dialogs pick up upstream's refreshed sizing, radii and range styling, and controls fill with a new `--control-background` token that flips with the surface beneath them instead of always matching the page. `Alert` gains an `AlertAction` slot for a dismiss or retry control, and `ButtonGroup` gains a vertical orientation plus `ButtonGroupText` and `ButtonGroupSeparator`, matching upstream; it now squares off only children that set a `data-slot`, so a plain wrapper between buttons keeps its own corners. Components that deliberately differ from shadcn now say so inline.
