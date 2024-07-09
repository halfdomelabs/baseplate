import { ProjectDefinition } from '../schema/index.js';
import { ProjectDefinitionContainer } from '@src/index.js';
import { PluginStore } from '@src/plugins/imports/types.js';
import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@src/schema/models/index.js';

export interface ParsedModelField extends ModelScalarFieldConfig {
  isLocked?: boolean;
}

export interface ParsedRelationField extends ModelRelationFieldConfig {
  isLocked?: boolean;
}

export interface ParsedModel extends ModelConfig {
  model: ModelConfig['model'] & {
    fields: ParsedModelField[];
    relations?: ParsedRelationField[];
  };
  service?: ModelConfig['service'];
}

export type PluginMergeModelFieldInput = Omit<ParsedModelField, 'id'>;
export type PluginMergeModelRelationInput = Omit<
  ParsedRelationField,
  'id' | 'foreignId'
>;

export interface PluginMergeModelInput
  extends Pick<ParsedModel, 'name' | 'feature' | 'service'> {
  model: Omit<ParsedModel['model'], 'fields' | 'relations'> & {
    fields: PluginMergeModelFieldInput[];
    relations?: PluginMergeModelRelationInput[];
  };
}

export interface PluginHooks {
  mergeModel: (model: PluginMergeModelInput) => void;
  addGlobalHoistedProviders: (providers: string | string[]) => void;
  addFeatureHoistedProviders: (
    featureId: string,
    providers: string | string[],
  ) => void;
  addFastifyChildren: (children: Record<string, unknown>) => void;
  addFeatureChildren: (
    featureId: string,
    children: Record<string, unknown>,
  ) => void;
}

export interface ParserPlugin {
  name: string;
  run(
    projectDefinition: ProjectDefinition,
    hooks: PluginHooks,
    container: ProjectDefinitionContainer,
  ): void;
}

/**
 * The context available to the schema parser, including the plugin store.
 */
export interface SchemaParserContext {
  pluginStore: PluginStore;
}
