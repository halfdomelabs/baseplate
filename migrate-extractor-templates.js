#!/usr/bin/env node

import { globby } from 'globby';
import { readFileSync, writeFileSync } from 'node:fs';

/**
 * Migration script to invert extractor.json template keys
 *
 * Changes from:
 * {
 *   "templates": {
 *     "file-path.ts": {
 *       "name": "template-name",
 *       "type": "ts"
 *     }
 *   }
 * }
 *
 * To:
 * {
 *   "templates": {
 *     "template-name": {
 *       "sourceFile": "file-path.ts",
 *       "type": "ts"
 *     }
 *   }
 * }
 */

async function migrateExtractorFiles() {
  console.log('🔍 Finding extractor.json files...');

  // Find all extractor.json files not in gitignored directories
  const extractorFiles = await globby('**/extractor.json', {
    absolute: true,
    gitignore: true,
    ignore: ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**'],
  });

  console.log(`📝 Found ${extractorFiles.length} extractor.json files`);

  let migratedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  for (const filePath of extractorFiles) {
    try {
      console.log(`\n🔄 Processing: ${filePath}`);

      const content = readFileSync(filePath, 'utf8');
      const config = JSON.parse(content);

      if (!config.templates || typeof config.templates !== 'object') {
        console.log('  ⏭️  No templates found, skipping');
        skippedCount++;
        continue;
      }

      const oldTemplates = config.templates;
      const newTemplates = {};
      let hasChanges = false;

      for (const [filePath, templateConfig] of Object.entries(oldTemplates)) {
        if (!templateConfig || typeof templateConfig !== 'object') {
          console.log(
            `  ⚠️  Invalid template config for ${filePath}, skipping`,
          );
          continue;
        }

        // Check if this is already in the new format
        if (templateConfig.sourceFile && !templateConfig.name) {
          console.log(`  ✅ Template ${filePath} already in new format`);
          newTemplates[filePath] = templateConfig;
          continue;
        }

        // Check if we have the required fields for migration
        if (!templateConfig.name) {
          console.log(
            `  ⚠️  Template ${filePath} missing name field, skipping`,
          );
          newTemplates[filePath] = templateConfig;
          continue;
        }

        // Perform the migration
        const templateName = templateConfig.name;
        const { name, ...restConfig } = templateConfig;

        newTemplates[templateName] = {
          sourceFile: filePath,
          ...restConfig,
        };

        console.log(`    📋 ${filePath} → ${templateName}`);
        hasChanges = true;
      }

      if (!hasChanges) {
        console.log('  ✅ No changes needed');
        skippedCount++;
        continue;
      }

      // Update the config
      const updatedConfig = {
        ...config,
        templates: newTemplates,
      };

      // Write back to file with pretty formatting
      const updatedContent = `${JSON.stringify(updatedConfig, null, 2)}\n`;
      writeFileSync(filePath, updatedContent, 'utf8');

      console.log('  ✅ Migration completed');
      migratedCount++;
    } catch (error) {
      console.error(`  ❌ Error processing ${filePath}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n📊 Migration Summary:');
  console.log(`   ✅ Migrated: ${migratedCount} files`);
  console.log(`   ⏭️  Skipped: ${skippedCount} files`);
  console.log(`   ❌ Errors: ${errorCount} files`);

  if (migratedCount > 0) {
    console.log('\n🎉 Migration completed! Remember to:');
    console.log('   1. Review the changes');
    console.log('   2. Run tests to ensure everything works');
    console.log('   3. Remove globby dependency from root package.json');
  }
}

// Run the migration
migrateExtractorFiles().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
