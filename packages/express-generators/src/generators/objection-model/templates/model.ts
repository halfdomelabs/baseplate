import { ColumnNameMappers, Model, snakeCaseMappers } from 'objection';

export class MODEL_CLASS_NAME extends Model {
  static get tableName(): string {
    return MODEL_TABLE_NAME;
  }

  static get columnNameMappers(): ColumnNameMappers {
    return snakeCaseMappers();
  }

  RELATIONSHIP_MAPPINGS;

  FIELDS;
}
