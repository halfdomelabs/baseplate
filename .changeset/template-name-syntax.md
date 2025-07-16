---
'@baseplate-dev/core-generators': patch
---

Add $templateName syntax for intra-generator template references

Templates can now reference other templates within the same generator using the `$templateName` syntax. This enables templates to access file paths of other templates in the same generator during generation.

Key features:

- Use `$templateName` in template files to reference other generator templates
- Kebab-case template names are automatically converted to camelCase (e.g., `session-constants` → `sessionConstants`)
- Configure referenced templates using the `referencedGeneratorTemplates` field in extractor.json
- Works seamlessly with existing variable replacement and import maps
- Provides clear error messages for missing template references

Example usage:

```typescript
// In template file
import { Constants } from '$sessionConstants';
import { Utils } from '$authUtils';

// In extractor.json
{
  "user-service": {
    "sourceFile": "services/user.service.ts",
    "referencedGeneratorTemplates": ["session-constants", "auth-utils"]
  }
}
```

This feature is designed for intra-generator template references only. For cross-generator references, continue using import map providers.
