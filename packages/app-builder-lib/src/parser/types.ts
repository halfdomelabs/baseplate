import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@src/schema/models';
import { AppConfig } from '../schema';

export interface ParsedModelField extends ModelScalarFieldConfig {
  isModelLocked?: boolean;
}

export interface ParsedRelationField extends ModelRelationFieldConfig {
  isModelLocked?: boolean;
}

export interface ParsedModel extends ModelConfig {
  model: {
    fields: ParsedModelField[];
    relations?: ParsedRelationField[];
    primaryKeys?: string[];
  };
  service?: {
    build?: boolean;
    embeddedRelations?: {
      localRelationName: string;
      embeddedFieldNames: string[];
    }[];
    createTransformers?: Record<string, unknown>;
    updateTransformers?: Record<string, unknown>;
  };
}

export type PluginMergeModelFieldInput = Pick<
  ParsedModelField,
  'name' | 'model' | 'isModelLocked'
>;

export type PluginMergeModelRelationInput = Pick<
  ParsedRelationField,
  'name' | 'model' | 'isModelLocked'
>;

export interface PluginMergeModelInput
  extends Pick<ParsedModel, 'name' | 'feature' | 'service'> {
  model: {
    fields: PluginMergeModelFieldInput[];
    relations?: PluginMergeModelRelationInput[];
    primaryKeys?: string[];
  };
}

export interface PluginHooks {
  mergeModel: (model: PluginMergeModelInput) => void;
  addGlobalHoistedProviders: (providers: string | string[]) => void;
  addFeatureHoistedProviders: (
    featurePath: string,
    providers: string | string[]
  ) => void;
  addFastifyChildren: (children: Record<string, unknown>) => void;
  addFeatureChildren: (
    featurePath: string,
    children: Record<string, unknown>
  ) => void;
}

export interface ParserPlugin {
  name: string;
  run(appConfig: AppConfig, hooks: PluginHooks): void;
}
