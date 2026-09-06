---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Text-entry and button-like controls (`Input`, `Textarea`, `InputGroup`, `InputOtp`, `NumberField`, `Combobox`, `Autocomplete`, `Select`) now accept an optional `size` of `sm`, `default` or `xl`, and `Button` gains `xl` and `icon-xl`. `xl` renders single-line controls at 44px with larger text; omitting `size` leaves every control looking exactly as it does today.
