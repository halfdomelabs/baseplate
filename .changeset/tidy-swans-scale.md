---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Text-entry and button-like controls now take an optional `size`: `Input`, `Textarea`, `InputGroup`, `InputOTP`, `NumberField`, `Combobox` and `Autocomplete` accept `sm`, `default` and `xl`, `Select` triggers and popups accept `xl`, and `Button` gains `xl` and `icon-xl`. `xl` renders single-line controls at 44px with larger text and embedded actions, leaving labels, descriptions and field layout unchanged. Omitting `size` keeps every control exactly as it looks today.
