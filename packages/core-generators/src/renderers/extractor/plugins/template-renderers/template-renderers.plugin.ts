import { createTemplateExtractorPlugin } from '@baseplate-dev/sync';
import { z } from 'zod';

import { normalizeTsPathToJsPath } from '#src/utils/ts-paths.js';

import type { TemplateRendererEntry } from './types.js';

import { templateExtractorBarrelExportPlugin } from '../barrel-export.js';
import {
  GENERATED_RENDERERS_FILE_NAME,
  writeRenderersFile,
} from './renderers-file.js';

const templateRenderersPluginConfigSchema = z.object({
  /**
   * Whether to skip generating the renderers file.
   */
  skip: z.boolean().default(false),
});

/**
 * The template renderers plugin is used to generate a file that exports
 * pre-configured template renderers with automatic path and import map provider resolution.
 */
export const templateRenderersPlugin = createTemplateExtractorPlugin({
  name: 'template-renderers',
  pluginDependencies: [templateExtractorBarrelExportPlugin],
  getInstance: ({ context, api }) => {
    const barrelExportPlugin = context.getPlugin(
      templateExtractorBarrelExportPlugin.name,
    );

    // Key: Generator name, Value: Array of template renderer entries
    const renderersByGenerator = new Map<string, TemplateRendererEntry[]>();

    function addTemplateRenderer(
      generatorName: string,
      rendererEntry: TemplateRendererEntry,
    ): void {
      const renderers = renderersByGenerator.get(generatorName) ?? [];
      renderers.push(rendererEntry);
      renderersByGenerator.set(generatorName, renderers);
    }

    api.registerHook('afterWrite', async () => {
      for (const [generatorName, renderers] of renderersByGenerator) {
        const config = context.configLookup.getPluginConfigForGenerator(
          generatorName,
          templateRenderersPlugin.name,
          templateRenderersPluginConfigSchema,
        );

        if (config?.skip) {
          continue;
        }

        const { exportName } = await writeRenderersFile(
          generatorName,
          renderers,
          context,
        );

        barrelExportPlugin.addGeneratedBarrelExport(generatorName, {
          moduleSpecifier: `./${normalizeTsPathToJsPath(GENERATED_RENDERERS_FILE_NAME)}`,
          namedExport: exportName,
          name: 'renderers',
        });
      }
    });

    return {
      addTemplateRenderer,
    };
  },
});
