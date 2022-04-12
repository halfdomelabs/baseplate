import * as yup from 'yup';
import { randomUid } from '@src/utils/randomUid';
import { MakeUndefinableFieldsOptional } from '@src/utils/types';
import { authSchema } from './auth';
import { backendSchema } from './backend';
import { modelSchema } from './models';
import { ObjectReference, ObjectReferenceable } from './references';

export const appConfigSchema = yup.object({
  name: yup.string().required(),
  version: yup.string().required(),
  // port to base the app ports on for development (e.g. 8000 => 8432 for DB)
  portBase: yup.number().required(),
  apps: yup
    .object({
      backend: backendSchema.nullable(),
    })
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

export type AppConfig = MakeUndefinableFieldsOptional<
  yup.InferType<typeof appConfigSchema>
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

export const APP_CONFIG_REFERENCEABLES = createObjectReferenceableList([
  { category: 'feature', path: 'features.*' },
  { category: 'model', path: 'models.*' },
  {
    category: 'modelField',
    path: 'models.*.model.fields.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
  {
    category: 'modelRelation',
    path: 'models.*.model.relations.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
]);

export const APP_CONFIG_REFERENCES: ObjectReference[] = [
  { category: 'feature', path: 'models.*.feature' },
  {
    name: 'modelPrimaryKey',
    category: 'modelField',
    path: 'models.*.model.primaryKeys',
    mapToKey: mapToAncestorNameCreator(0),
  },
  {
    name: 'modelLocalRelation',
    category: 'modelField',
    path: 'models.*.model.relations.*.references.*.local',
    mapToKey: mapToAncestorNameCreator(5),
  },
  {
    category: 'modelField',
    path: 'models.*.model.relations.*.references.*.foreign',
    mapToKey: mapToAncestorNameCreator(2, 'modelName'),
  },
  {
    category: 'modelField',
    path: 'models.*.model.service.create.fields.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelField',
    path: 'models.*.model.service.update.fields.*',
    mapToKey: mapToAncestorNameCreator(3),
  },
  {
    category: 'modelField',
    path: 'models.*.model.schema.exposedFields.*',
    mapToKey: mapToAncestorNameCreator(2),
  },
];
