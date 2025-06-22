import type { ReactElement } from 'react';

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@baseplate-dev/ui-components';
import { capitalize } from 'es-toolkit';

import type { ModelMergerModelDiffResult } from '#src/tools/index.js';

import { modelMergerDefinitionDiffConfig } from '#src/tools/index.js';

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
                {Object.entries(change.changes).map(([key, value]) => {
                  const field =
                    modelMergerDefinitionDiffConfig[
                      key as keyof typeof modelMergerDefinitionDiffConfig
                    ];

                  if (!field) {
                    return null;
                  }

                  if (value?.length) {
                    return (
                      <li key={key}>
                        {value.length === 1 ? (
                          capitalize(field.name)
                        ) : (
                          <>
                            <span className="font-medium">{value.length}</span>{' '}
                            {field.name}(s)
                          </>
                        )}{' '}
                        will be {field.getActionVerb(change.isNewModel)}
                      </li>
                    );
                  }
                })}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      ))}
    </div>
  );
}
