import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { BaseAppConfig, WebAppConfig, webAppSchema } from './apps';
import { BackendAppConfig, backendAppSchema } from './apps/backend';
import { authSchema } from './auth';
import { modelSchema } from './models';
import { ObjectReference, ObjectReferenceable } from './references';

export type AppConfig = BackendAppConfig | WebAppConfig;

export const projectConfigSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portBase: yup.number().required(),
  apps: yup
    .array()
    .of(
      yup.lazy((value: AppConfig) => {
        if (value.type === 'backend') {
          return backendAppSchema;
        }
        if (value.type === 'web') {
          return webAppSchema;
        }
        throw new Error(`Unknown app type: ${(value as BaseAppConfig).type}`);
      }) as unknown as yup.SchemaOf<AppConfig>
    )
    .required(),
  features: yup.array(
    yup.object({
      uid: yup.string().default(randomUid),
      name: yup.string().required(),
    })
  ),
  models: yup.array(modelSchema),
  auth: authSchema.optional().default(undefined),
});

export type ProjectConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof projectConfigSchema>
>;

interface ObjectReferenceableWithOptionalProperties
  extends Omit<ObjectReferenceable, 'idProperty' | 'nameProperty'> {
  idProperty?: string;
  nameProperty?: string;
}

export function createObjectReferenceableList(
  referenceable: ObjectReferenceableWithOptionalProperties[]
): ObjectReferenceable[] {
  return referenceable.map((r) => ({
    nameProperty: 'name',
    idProperty: 'uid',
    ...r,
  }));
}

function mapToAncestorNameCreator(
  depth: number,
  nameFieldName = 'name'
): (name: string, parents: unknown[]) => string {
  return (name: string, parents: unknown[]): string => {
    const ancestor = parents[depth] as Record<string, string | undefined>;
    const ancestorName = ancestor[nameFieldName];
    if (!ancestorName) {
      console.log(parents);
      throw new Error(
        `Ancestor at depth ${
          depth + 1
        } has no ${nameFieldName} (available keys: ${Object.keys(ancestor).join(
          ','
        )})`
      );
    }
    return `${ancestorName}.${name}`;
  };
}

export const PROJECT_CONFIG_REFERENCEABLES = createObjectReferenceableList([
  { category: 'feature', path: 'features.*' },
  { category: 'model', path: 'models.*' },
  {
    category: 'modelField',
    path: 'models.*.model.fields.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelLocalRelation',
    path: 'models.*.model.relations.*',
    nameProperty: 'name',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelForeignRelation',
    path: 'models.*.model.relations.*',
    nameProperty: 'foreignRelationName',
    mapToKey: mapToAncestorNameCreator(0, 'modelName'),
  },
  {
    category: 'modelTransformer',
    path: 'models.*.service.transformers.*',
    nameProperty: 'name',
    mapToKey: mapToAncestorNameCreator(3),
  },
  { category: 'role', path: 'auth.roles.*' },
]);

export const PROJECT_CONFIG_REFERENCES: ObjectReference[] = [
  { category: 'feature', path: 'models.*.feature' },
  {
    name: 'modelPrimaryKey',
    category: 'modelField',
    path: 'models.*.model.primaryKeys.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
  {
    name: 'modelLocalRelation',
    category: 'modelField',
    path: 'models.*.model.relations.*.references.*.local',
    mapToKey: mapToAncestorNameCreator(5),
  },
  {
    name: 'modelUniqueConstraint',
    category: 'modelField',
    path: 'models.*.model.uniqueConstraints.*.fields.*.name',
    mapToKey: mapToAncestorNameCreator(5),
  },
  {
    category: 'modelField',
    path: 'models.*.model.relations.*.references.*.foreign',
    mapToKey: mapToAncestorNameCreator(2, 'modelName'),
  },
  {
    category: 'modelField',
    path: 'models.*.service.create.fields.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelField',
    path: 'models.*.service.update.fields.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelTransformer',
    path: 'models.*.service.create.transformerNames.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelTransformer',
    path: 'models.*.service.update.transformerNames.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelForeignRelation',
    path: 'models.*.service.transformers.*.name',
    shouldInclude: (name, parents) => {
      const { type } = parents[0] as { type: string };
      if (!type) {
        throw new Error('Missing type');
      }
      return type === 'embeddedRelation';
    },
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelField',
    path: 'models.*.service.transformers.*.embeddedFieldNames.*',
    shouldInclude: (name, parents) => {
      const { type } = parents[1] as { type: string };
      if (!type) {
        throw new Error('Missing type');
      }
      return type === 'embeddedRelation';
    },
    mapToKey: (name, parents, object: ProjectConfig) => {
      const { name: localRelationName } = parents[1] as { name: string };
      if (!localRelationName) {
        throw new Error(
          `Could not find localRelationName of model with embedded relation`
        );
      }
      const { name: modelName } = parents[4] as { name: string };
      if (!modelName) {
        throw new Error(`Could not find name of model with embedded relation`);
      }
      // find corresponding model
      const foreignModel = object.models?.find((model) =>
        model.model.relations?.some(
          (relation) =>
            relation.modelName === modelName &&
            relation.foreignRelationName === localRelationName
        )
      );

      if (!foreignModel) {
        throw new Error(
          `Could not find model associated with embedded relation ${modelName}/${localRelationName}`
        );
      }

      return `${foreignModel.name}.${name}`;
    },
  },
  {
    category: 'modelField',
    path: 'models.*.schema.exposedFields.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
  {
    category: 'modelLocalRelation',
    path: 'models.*.schema.exposedLocalRelations.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
  {
    category: 'modelForeignRelation',
    path: 'models.*.schema.exposedForeignRelations.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
  {
    category: 'role',
    path: 'models.*.schema.authorize.read.*',
  },
  {
    category: 'role',
    path: 'models.*.schema.authorize.create.*',
  },
  {
    category: 'role',
    path: 'models.*.schema.authorize.update.*',
  },
  {
    category: 'role',
    path: 'models.*.schema.authorize.delete.*',
  },
  {
    category: 'model',
    path: 'auth.userModel',
  },
  {
    category: 'model',
    path: 'auth.userRoleModel',
  },
  {
    category: 'feature',
    path: 'auth.authFeaturePath',
  },
  {
    category: 'feature',
    path: 'auth.accountsFeaturePath',
  },
];
