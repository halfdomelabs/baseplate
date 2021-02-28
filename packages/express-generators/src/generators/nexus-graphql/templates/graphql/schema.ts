import { makeSchema } from 'nexus';
import path from 'path';
import R from 'ramda';
import AppFeatures from '../features';

const srcPath = path.join(__dirname, '..');

export function buildSchema(): ReturnType<typeof makeSchema> {
  return makeSchema({
    types: AppFeatures.schema,
    outputs: {
      typegen: path.join(srcPath, 'generated/nexus-typegen.d.ts'),
      schema: path.join(srcPath, '..', 'schema.graphql'),
    },
  });
}
