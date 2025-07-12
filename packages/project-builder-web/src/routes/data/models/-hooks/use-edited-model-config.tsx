import type {
  ModelConfig,
  ModelConfigInput,
} from '@baseplate-dev/project-builder-lib';
import type React from 'react';
import type { UseFormGetValues, UseFormWatch } from 'react-hook-form';
import type { StoreApi } from 'zustand';

import { jsonDeepClone } from '@baseplate-dev/utils';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { createStore, useStore } from 'zustand';

import { useDeep } from '#src/hooks/use-deep.js';

interface ModelConfigStore {
  model: ModelConfigInput;
  setModel: (model: ModelConfigInput) => void;
  getValues: UseFormGetValues<ModelConfigInput>;
}

const EditedModelContext = createContext<
  StoreApi<ModelConfigStore> | undefined
>(undefined);

export function EditedModelContextProvider({
  originalModel,
  children,
  watch,
  getValues,
}: {
  originalModel: ModelConfig;
  children: React.ReactNode;
  watch: UseFormWatch<ModelConfigInput>;
  getValues: UseFormGetValues<ModelConfigInput>;
}): React.JSX.Element {
  const store = useMemo(
    () =>
      createStore<ModelConfigStore>((set) => ({
        model: {
          ...originalModel,
          ...getValues(),
        },
        setModel: (model) => {
          set({
            model: {
              ...originalModel,
              ...model,
            },
          });
        },
        getValues,
      })),
    [originalModel, getValues],
  );

  useEffect(() => {
    const { unsubscribe } = watch((data) => {
      // We need to clone the data since React hook form data store is not immutable
      store.getState().setModel(jsonDeepClone(data as ModelConfigInput));
    });
    return unsubscribe;
  }, [watch, store]);

  return (
    <EditedModelContext.Provider value={store}>
      {children}
    </EditedModelContext.Provider>
  );
}

export function useEditedModelConfig<T>(
  selector: (model: ModelConfigInput) => T,
): T {
  const store = useContext(EditedModelContext);
  if (!store) {
    throw new Error(
      'useEditedModelConfig must be used within a EditedModelContextProvider',
    );
  }
  return useStore(
    store,
    useDeep((state) => selector(state.model)),
  );
}
