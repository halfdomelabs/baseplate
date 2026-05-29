---
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Upgrade @base-ui/react from 1.2.0 to 1.4.1 to fix iOS + Safari combobox issues

- @base-ui/react: 1.2.0 → 1.4.1

The 1.4.0 release includes combobox fixes for iOS viewport settling (#4351),
preventing item taps from blurring the input (#4578), and scroll lock handling
for touch input on full-width anchored modal popups (#3100), which address the
iOS + Safari combobox issues (ENG-1161).
