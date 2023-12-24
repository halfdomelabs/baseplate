import { ProjectConfig } from '../schema/index.js';
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

export type PluginMergeModelFieldInput = Omit<ParsedModelField, 'id' | 'uid'>;
export type PluginMergeModelRelationInput = Omit<
  ParsedRelationField,
  'id' | 'uid'
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
    featurePath: string,
    providers: string | string[],
  ) => void;
  addFastifyChildren: (children: Record<string, unknown>) => void;
  addFeatureChildren: (
    featurePath: string,
    children: Record<string, unknown>,
  ) => void;
}

export interface ParserPlugin {
  name: string;
  run(projectConfig: ProjectConfig, hooks: PluginHooks): void;
}
