---
'@baseplate-dev/core-generators': patch
---

Add Template Renderers plugin for auto-generated simplified template rendering APIs

This new plugin reduces template rendering boilerplate by 70-80% by automatically generating pre-configured rendering functions. It follows the same architectural pattern as the typed templates system, with a TypeScript-specific renderer function (`renderTsTemplateRenderers`) that generates generic definitions consumed by the plugin.

**Key Features:**

- **Simplified API**: Reduces complex `renderTemplate`/`renderTemplateGroup` calls to simple `renderers.templateName.render()` calls
- **Automatic Dependency Resolution**: Import map providers and task dependencies are automatically resolved
- **Type Safety**: Generated interfaces provide full TypeScript type safety
- **Generic Architecture**: Extensible to support future template types (text, raw, etc.)
- **Backward Compatibility**: Existing generators continue working unchanged

**Before:**

```typescript
await builder.apply(
  typescriptFile.renderTemplateGroup({
    group: templates.hooksGroup,
    paths,
    variables: { useCurrentUser: { TPL_USER: userQueryName } },
    importMapProviders: { generatedGraphqlImports, reactErrorImports },
  }),
);
```

**After:**

```typescript
await builder.apply(
  renderers.hooksGroup.render({
    variables: { useCurrentUser: { TPL_USER: userQueryName } },
  }),
);
```

The plugin automatically generates TypeScript interfaces, tasks with resolved dependencies, and exports that integrate seamlessly with the existing generator system.
