import {
  ModelConfig,
  ModelRelationFieldConfig,
  ModelScalarFieldConfig,
} from '@src/schema/models';
import { AppConfig } from '../schema';

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
  service?: ModelConfig['service'] & {
    createTransformers?: Record<string, unknown>;
    updateTransformers?: Record<string, unknown>;
  };
}

export type PluginMergeModelInput = Pick<
  ParsedModel,
  'name' | 'feature' | 'service' | 'model'
>;

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
