---
'@baseplate-dev/ui-components': patch
'@baseplate-dev/react-generators': patch
---

Adds Radio and Number field components and controllers, and form fields now share a single empty-value convention so clearing an optional field is saved instead of being silently ignored — numeric inputs no longer submit `NaN` when cleared.
