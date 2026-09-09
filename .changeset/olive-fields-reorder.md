---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
'@baseplate-dev/plugin-storage': patch
'@baseplate-dev/project-builder-web': patch
---

Vertical form fields now render the description between the label and the control, so a format hint is visible before you type rather than after, and they no longer emit empty label or description elements when those slots are unused. Checkbox and switch fields are unchanged.
