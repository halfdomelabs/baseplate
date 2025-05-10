import type {
  PluginMetadataWithPaths,
  SchemaParserContext,
} from '@halfdomelabs/project-builder-lib';

import { getPluginsMetadata } from '@src/services/api';
import { subscribeToViteHotReloadEvent } from '@src/services/hot-loader';
import { resetPluginModuleSeed } from '@src/services/module-federation';
import { createWebSchemaParserContext } from '@src/services/schema-parser-context';

export class SchemaParserContextManager {
  public readonly projectId: string;

  protected _pluginsMetadata: PluginMetadataWithPaths[] | undefined;
  protected _schemaParserContext: SchemaParserContext | undefined;

  constructor(projectId: string) {
    this.projectId = projectId;
  }

  async loadSchemaParserContext(): Promise<SchemaParserContext> {
    this._pluginsMetadata ??= await getPluginsMetadata(this.projectId);
    resetPluginModuleSeed();
    this._schemaParserContext = await createWebSchemaParserContext(
      this.projectId,
      this._pluginsMetadata,
    );
    return this._schemaParserContext;
  }

  listenForPluginAssetsChanges(
    onSchemaParserContextUpdated: (
      schemaParserContext: SchemaParserContext,
    ) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return subscribeToViteHotReloadEvent('plugin-assets-changed', () => {
      this.loadSchemaParserContext()
        .then((schemaParserContext) => {
          onSchemaParserContextUpdated(schemaParserContext);
        })
        .catch((error: unknown) => {
          onError(error);
        });
    });
  }
}
