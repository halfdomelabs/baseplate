# Template Renderers Plugin

The Template Renderers plugin automatically generates pre-configured template rendering functions that eliminate the need for manual path and import map provider configuration.

## Overview

This plugin extends the template extraction system to generate a `renderers` export that provides simplified template rendering APIs. It follows the same pattern as the auto-generated `paths` and `imports` tasks, using a renderer function (like `renderTsTemplateRenderers`) to generate template-specific definitions that the plugin then consumes.

## Generated Structure

For each generator, the plugin generates:

1. **Provider Interface**: Defines render functions for each template/group
2. **Renderers Task**: Auto-configured task with resolved dependencies
3. **Barrel Export**: Adds renderers to the main generated export

## Usage

### Before (Manual Configuration)

```typescript
await builder.apply(
  typescriptFile.renderTemplateGroup({
    group: AUTH0_HOOKS_GENERATED.templates.hooksGroup,
    paths,
    variables: { useCurrentUser: { TPL_USER: userQueryName } },
    importMapProviders: {
      generatedGraphqlImports,
      reactErrorImports,
    },
  }),
);
```

### After (Simplified API)

```typescript
await builder.apply(
  renderers.hooksGroup.render({
    variables: { useCurrentUser: { TPL_USER: userQueryName } },
  }),
);
```

## Generated API Structure

```typescript
// Generated interface
interface GeneratorRenderers {
  templateName: {
    render: (options: { variables?: Record<string, any> }) => Promise<void>;
  };
}

// Generated task with auto-resolved dependencies
const renderersTask = createGeneratorTask({
  dependencies: {
    typescriptFile: typescriptFileProvider,
    paths: GENERATOR_PATHS.provider,
    templates: GENERATOR_TEMPLATES,
    // Auto-resolved import map providers based on template dependencies
    reactImports: reactImportProvider,
  },
  exports: {
    renderers: renderersProvider.export(),
  },
  run({ typescriptFile, paths, templates, reactImports }) {
    return {
      providers: {
        renderers: {
          templateName: {
            render: (options) =>
              typescriptFile.renderTemplate({
                template: templates.templateName,
                paths,
                importMapProviders: { reactImports },
                variables: options.variables,
              }),
          },
        },
      },
    };
  },
});
```

## Benefits

1. **Reduced Boilerplate**: 70-80% reduction in template rendering code
2. **Automatic Dependency Resolution**: Import map providers are automatically resolved
3. **Type Safety**: Generated interfaces provide full type safety
4. **Consistency**: Follows established patterns from paths/imports auto-generation
5. **Backward Compatibility**: Existing generators continue to work unchanged

## Configuration

The plugin supports optional configuration:

```typescript
// In generator configuration
{
  "extractors": {
    "ts": {
      "plugins": {
        "template-renderers": {
          "skipTaskGeneration": false // Default: false
        }
      }
    }
  }
}
```

## Architecture: Following the `renderTsTypedTemplates` Pattern

This plugin follows the exact same pattern as the typed templates system:

### 1. **Renderer Function**: `renderTsTemplateRenderers`

Similar to `renderTsTypedTemplates`, this function:

- Takes template entries and context
- Generates `TemplateRendererDefinition` objects with all necessary metadata
- Handles TypeScript-specific logic (render functions, dependencies, import providers)

```typescript
export interface TemplateRendererDefinition {
  templateName: string;
  providerInterface: {
    name: string;
    renderSignature: string;
  };
  taskDependencies: TemplateRendererTaskDependency[];
  renderFunction: string; // The actual render function code
  importMapProviders: string[];
}

// TypeScript-specific renderer
const templateRenderers = renderTsTemplateRenderers(templates, {
  generatorPackageName: generatorConfig.packageName,
  generatorName,
});
```

### 2. **Generic Plugin Consumption**

The plugin receives pre-processed definitions and handles file generation:

```typescript
for (const templateRenderer of templateRenderers) {
  templateRenderersPlugin.addTemplateRenderer(generatorName, templateRenderer);
}
```

### 3. **Extensibility for Other Template Types**

Future template types (text, raw, etc.) can be added by creating their own renderer functions:

```typescript
// Future: renderTextTemplateRenderers, renderRawTemplateRenderers, etc.
const textRenderers = renderTextTemplateRenderers(templates, context);
for (const renderer of textRenderers) {
  templateRenderersPlugin.addTemplateRenderer(generatorName, renderer);
}
```

### 4. **Dynamic Dependency Resolution**

The plugin automatically collects dependencies from all renderer definitions:

- Task dependencies (providers like `typescriptFile`, `textFile`)
- Import map providers (for symbol resolution)
- Creates unified dependency graph for the generated task

### File Structure

```
packages/core-generators/src/renderers/
├── extractor/plugins/template-renderers/
│   ├── index.ts                                    # Exports
│   ├── template-renderers.plugin.ts               # Generic plugin implementation
│   ├── renderers-file.ts                          # Generic file generation logic
│   ├── template-renderers.plugin.unit.test.ts     # Plugin tests
│   ├── renderers-file.unit.test.ts                # File generation tests
│   └── README.md                                   # This documentation
└── typescript/extractor/
    └── render-ts-template-renderers.ts            # TypeScript-specific renderer function
```

## Migration Guide

### For Existing Generators

No migration is required - existing generators will continue to work unchanged. The template renderers are generated alongside existing functionality.

### To Use New API

1. Update your generator tasks to depend on the renderers:

```typescript
const myGeneratorTask = createGeneratorTask({
  dependencies: {
    // ... existing dependencies
    renderers: MY_GENERATOR_GENERATED.renderers.provider,
  },
  // ...
});
```

2. Use the simplified render API:

```typescript
// Replace manual renderTemplate/renderTemplateGroup calls
await builder.apply(
  renderers.myTemplate.render({ variables: { ... } })
);
```

### For Adding New Template Types

Follow the established pattern:

1. Create a renderer function (e.g., `renderTextTemplateRenderers`)
2. Define task dependencies and render functions for your template type
3. Use the existing generic plugin - no changes needed
4. Follow the same integration pattern in your template extractor

## Testing

The plugin includes comprehensive unit tests covering:

- Plugin registration and configuration
- Template renderer entry registration
- Generated file structure and content
- Export name generation
- Error handling and edge cases

Run tests with:

```bash
pnpm test template-renderers
```
