---
'@baseplate-dev/project-builder-server': patch
---

Fix ignore patterns for monorepo root to handle .turbo/** and apps/** correctly. Added .turbo/** to .gitignore and implemented manual apps/** ignore when running commands on monorepo root to work around VSCode Prettier issue (https://github.com/prettier/prettier-vscode/issues/3424) where adding apps/** to prettier config would incorrectly ignore all prettier formatting in apps/** subdirectories.
