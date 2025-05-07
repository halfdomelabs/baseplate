import type { ModelConfig } from '@halfdomelabs/project-builder-lib';
import type React from 'react';
import type { UseFormGetValues, UseFormWatch } from 'react-hook-form';
import type { StoreApi } from 'zustand';

import { ModelUtils } from '@halfdomelabs/project-builder-lib';
import { useProjectDefinition } from '@halfdomelabs/project-builder-lib/web';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { createStore, useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

interface ModelConfigStore {
  model: ModelConfig;
  setModel: (model: ModelConfig) => void;
  getValues: UseFormGetValues<ModelConfig>;
}

const EditedModelContext = createContext<
  StoreApi<ModelConfigStore> | undefined
>(undefined);

export function EditedModelContextProvider({
  children,
  watch,
  initialModel,
  getValues,
}: {
  children: React.ReactNode;
  watch: UseFormWatch<ModelConfig>;
  getValues: UseFormGetValues<ModelConfig>;
  initialModel: ModelConfig;
}): React.JSX.Element {
  const { definition } = useProjectDefinition();
  const existingModel = ModelUtils.byIdOrThrow(definition, initialModel.id);
  const store = useMemo(
    () =>
      createStore<ModelConfigStore>((set) => ({
        model: {
          ...existingModel,
          ...initialModel,
        },
        setModel: (model) => {
          set({
            model: {
              ...existingModel,
              ...model,
            },
          });
        },
        getValues,
      })),
    [initialModel, getValues, existingModel],
  );

  useEffect(() => {
    const { unsubscribe } = watch((data) => {
      store.getState().setModel(data as ModelConfig);
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
  selector: (model: ModelConfig) => T,
): T {
  const store = useContext(EditedModelContext);
  if (!store) {
    throw new Error(
      'useEditedModelConfig must be used within a EditedModelContextProvider',
    );
  }
  return useStore(
    store,
    useShallow((state) => selector(state.model)),
  );
}
