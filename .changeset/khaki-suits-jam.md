---
'@baseplate-dev/ui-components': patch
---

Fixed a shadow rule on `Sidebar`'s outline button variant that silently no-opped against oklch tokens, renamed the `surface-*` status-color utilities to `tone-*` (freeing "surface" for background/card/popover), added `tone-success`/`tone-warning` variants to `Badge`, and gave buttons a pointer cursor by default. `Alert`'s border now tints with its variant instead of always rendering the default border color. Removed remaining literal `bg-white`/`bg-black` colors from `Slider`, `ColorPickerField`, `Dialog`, and `Sheet`.
