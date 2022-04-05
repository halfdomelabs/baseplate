import { AppConfig } from '@src/schema';
import { ModelConfig, ModelScalarFieldConfig } from '@src/schema/models';

interface ParsedModelField extends ModelScalarFieldConfig {
  isVirtual?: boolean;
}

interface ParsedModel extends ModelConfig {
  fields: ParsedModelField[];
  isVirtual?: boolean;
}

function parseModels(appConfig: AppConfig): ParsedModel[] {
  const models: ParsedModel[] =
    appConfig.models?.map((model) => ({
      ...model,
      fields: model.fields || [],
    })) || [];

  // annotate user model
  const { auth } = appConfig;
  if (auth) {
    // find user model
    const userModel = models.find((m) => m.name === auth.userModel);
    if (!userModel) {
      throw new Error(`Could not find user model ${auth.userModel}`);
    }
    userModel.fields.push({
      name: 'tokensNotBefore',
      type: 'dateTime',
      optional: true,
      isVirtual: true,
    });

    if (auth.passwordProvider) {
      userModel.fields.push({
        name: 'passwordHash',
        type: 'string',
        optional: true,
        isVirtual: true,
      });
    }

    // create user role model
    const userRoleModel = models.find((m) => m.name === auth.userRoleModel);
    if (!userRoleModel) {
      throw new Error(`Could not find user role model ${auth.userModel}`);
    }
  }

  return models;
}

export class ParsedAppConfig {
  protected models: ModelConfig[];

  constructor(public appConfig: AppConfig) {
    this.models = parseModels(appConfig);
  }

  getModels(): ModelConfig[] {
    return this.models;
  }
}
