---
'@baseplate-dev/project-builder-lib': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/project-builder-server': patch
'@baseplate-dev/project-builder-web': patch
'@baseplate-dev/ui-components': patch
---

Connect theme builder UI to code generation. Theme color configuration from the project definition now drives the generated `styles.css` instead of hardcoded values. Default theme uses slate base with indigo primary. Remove explicit hover color variables (primaryHover, secondaryHover, destructiveHover) and linkVisited — hover is now computed via `color-mix` in CSS. Add palette swatch selection to theme color picker. Split preview into surface and interactive sections with input group and alert components.
