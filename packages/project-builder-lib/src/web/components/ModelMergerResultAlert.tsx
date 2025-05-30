import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@halfdomelabs/ui-components';
import { type ReactElement } from 'react';

import type { ModelMergerModelDiffResult } from '#src/tools/index.js';

interface Props {
  pendingModelChanges: Record<string, ModelMergerModelDiffResult | undefined>;
}

export function ModelMergerResultAlert({
  pendingModelChanges,
}: Props): ReactElement | null {
  const changes = Object.values(pendingModelChanges).filter(
    (change): change is ModelMergerModelDiffResult => change !== undefined,
  );
  if (changes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {changes.map((change) => (
        <Alert
          key={change.name}
          variant={change.isNewModel ? 'default' : 'warning'}
        >
          <AlertTitle>
            {change.isNewModel ? 'New Model' : 'Model Changes'}: {change.name}
          </AlertTitle>
          <AlertDescription>
            <div className="mt-2 space-y-2">
              {change.isNewModel ? (
                <p>
                  This is a new model that will be created with the following
                  configuration:
                </p>
              ) : (
                <p>The following changes will be applied to the model:</p>
              )}

              <ul className="list-disc pl-4 space-y-1">
                {change.changes['model.fields']?.length ? (
                  <li>
                    <span className="font-medium">
                      {change.changes['model.fields'].length}
                    </span>{' '}
                    field(s) will be
                    {change.isNewModel ? ' created' : ' added or updated'}
                  </li>
                ) : undefined}

                {change.changes['model.relations']?.length ? (
                  <li>
                    <span className="font-medium">
                      {change.changes['model.relations'].length}
                    </span>{' '}
                    relation(s) will be
                    {change.isNewModel ? ' created' : ' added or updated'}
                  </li>
                ) : undefined}

                {change.changes['model.uniqueConstraints']?.length ? (
                  <li>
                    <span className="font-medium">
                      {change.changes['model.uniqueConstraints'].length}
                    </span>{' '}
                    unique constraint(s) will be{' '}
                    {change.isNewModel ? 'created' : 'added or updated'}
                  </li>
                ) : undefined}

                {change.changes['model.primaryKeyFieldRefs']?.length ? (
                  <li>
                    Primary key will be {change.isNewModel ? 'set' : 'updated'}{' '}
                    with{' '}
                    <span className="font-medium">
                      {change.changes['model.primaryKeyFieldRefs'].length}
                    </span>{' '}
                    field(s)
                  </li>
                ) : undefined}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
