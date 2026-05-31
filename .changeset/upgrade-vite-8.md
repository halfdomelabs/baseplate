---
'@baseplate-dev/core-generators': patch
'@baseplate-dev/react-generators': patch
'@baseplate-dev/ui-components': patch
---

Upgrade Vite to v8, vitest to 4.1.7, @vitejs/plugin-react to 6.x, @tailwindcss/vite to 4.3.0, and Storybook to 10.4.1. Keep `vite-tsconfig-paths` in generated projects as Vite 8's native `resolve.tsconfigPaths` does not follow tsconfig project references (vitejs/vite#21889).
