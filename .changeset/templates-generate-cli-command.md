---
'@baseplate-dev/project-builder-cli': patch
'@baseplate-dev/sync': patch
'@baseplate-dev/project-builder-server': patch
---

Add templates generate CLI command for regenerating template files without extraction

- Add `templates generate <directory> <app>` CLI command to regenerate template files from existing extractor.json configurations
- Add `--skip-clean` option to skip cleaning output directories
- Add `generateTemplateFiles` function in sync package that initializes plugins and writes generated files without running extraction
- Add `generateTemplateFilesForProject` wrapper function in project-builder-server
- Command allows manual modification of extractor.json followed by regeneration without full extraction process
