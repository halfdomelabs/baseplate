import type { VariableDeclaration } from 'ts-morph';

import { createTypescriptMorpher } from '#src/types.js';

import { addOrUpdateImport } from './utils/imports.js';

export default createTypescriptMorpher({
  name: 'definition-schema-wrapper',
  description:
    'Wraps zod schema exports with definitionSchema and updates type inference',
  options: {},
  pathGlobs: ['src/schema/**/*.ts'],
  saveUsingTsMorph: true,
  transform: (sourceFile) => {
    let hasChanges = false;
    let needsDefinitionSchemaImport = false;
    let needsDefTypeImport = false;
    const renamedSchemas = new Map<string, string>();

    // First pass: Find variable declarations ending with "Schema" and track them
    for (const variableStatement of sourceFile.getVariableStatements()) {
      for (const variableDeclaration of variableStatement.getDeclarations()) {
        const name = variableDeclaration.getName();

        if (name.endsWith('Schema') && !name.startsWith('create')) {
          const newName = `create${name.charAt(0).toUpperCase()}${name.slice(1)}`;
          renamedSchemas.set(name, newName);
        }
      }
    }

    // Second pass: Transform the schema declarations
    // Process in multiple sub-passes to handle dependencies correctly
    const schemaDeclarations: {
      name: string;
      newName: string;
      declaration: VariableDeclaration;
    }[] = [];

    // Collect all schema declarations first
    for (const variableStatement of sourceFile.getVariableStatements()) {
      for (const variableDeclaration of variableStatement.getDeclarations()) {
        const name = variableDeclaration.getName();
        if (name.endsWith('Schema') && !name.startsWith('create')) {
          const newName = renamedSchemas.get(name);
          if (!newName) throw new Error(`No new name found for ${name}`);
          schemaDeclarations.push({
            name,
            newName,
            declaration: variableDeclaration,
          });
        }
      }
    }

    // Transform each schema declaration
    for (const { name, newName, declaration } of schemaDeclarations) {
      const initializer = declaration.getInitializer();
      if (initializer) {
        let schemaText = initializer.getText();
        let needsCtx = false;

        // Check if schema contains references to other schemas we're transforming
        // Note: we need to check for the NEW names since schema names are already renamed
        for (const [oldName, newSchemaName] of renamedSchemas) {
          // Skip self-reference
          if (oldName === name) continue;

          // Use word boundary regex to match exact variable names
          const regex = new RegExp(`\\b${newSchemaName}\\b`, 'g');
          if (regex.test(schemaText)) {
            needsCtx = true;

            // Replace references with new name + (ctx)
            schemaText = schemaText.replace(regex, `${newSchemaName}(ctx)`);
          }
        }

        // Wrap with definitionSchema
        const ctxParam = needsCtx ? '(ctx) => ' : '() => ';
        const wrappedInitializer = `definitionSchema(${ctxParam}${schemaText})`;

        declaration.rename(newName);
        declaration.setInitializer(wrappedInitializer);
        needsDefinitionSchemaImport = true;
        hasChanges = true;
      }
    }

    // Third pass: Update export declarations
    for (const exportDeclaration of sourceFile.getExportDeclarations()) {
      if (!exportDeclaration.hasNamedExports()) continue;

      for (const namedExport of exportDeclaration.getNamedExports()) {
        const name = namedExport.getName();
        if (renamedSchemas.has(name)) {
          const newName = renamedSchemas.get(name);
          if (!newName) throw new Error(`No new name found for ${name}`);
          namedExport.setName(newName);
          hasChanges = true;
        }
      }
    }

    // Fourth pass: Transform type declarations
    for (const typeAlias of sourceFile.getTypeAliases()) {
      const typeNode = typeAlias.getTypeNode();
      if (!typeNode) continue;

      let typeText = typeNode.getText();
      let hasTypeChanges = false;

      // Transform z.infer<typeof xSchema> to def.InferOutput<typeof createXSchema>
      // Note: by this time, schema names have been renamed, so check for new names
      for (const [, newName] of renamedSchemas) {
        // Handle z.infer<typeof newSchemaName> -> def.InferOutput<typeof newSchemaName>
        const zInferPattern = `z.infer<typeof ${newName}>`;
        if (typeText.includes(zInferPattern)) {
          typeText = typeText.replace(
            zInferPattern,
            `def.InferOutput<typeof ${newName}>`,
          );
          hasTypeChanges = true;
          needsDefTypeImport = true;
        }

        // Handle z.input<typeof newSchemaName> -> def.InferInput<typeof newSchemaName>
        const zInputPattern = `z.input<typeof ${newName}>`;
        if (typeText.includes(zInputPattern)) {
          typeText = typeText.replace(
            zInputPattern,
            `def.InferInput<typeof ${newName}>`,
          );
          hasTypeChanges = true;
          needsDefTypeImport = true;
        }
      }
      if (hasTypeChanges) {
        typeAlias.setType(typeText);
        hasChanges = true;
      }
    }

    // Add necessary imports
    if (needsDefinitionSchemaImport) {
      addOrUpdateImport(
        sourceFile,
        '#src/schema/creator/schema-creator.js',
        ['definitionSchema'],
        false,
      );
    }

    if (needsDefTypeImport) {
      addOrUpdateImport(
        sourceFile,
        '#src/schema/creator/index.js',
        ['def'],
        true,
      );
    }

    return hasChanges ? sourceFile.getFullText() : undefined;
  },
});
