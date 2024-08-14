import { ModelConfig } from '@halfdomelabs/project-builder-lib';
import { createContext, useContext, useEffect, useMemo } from 'react';
import { UseFormGetValues, UseFormWatch } from 'react-hook-form';
import { StoreApi, createStore, useStore } from 'zustand';

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
}): JSX.Element {
  const store = useMemo(
    () =>
      createStore<ModelConfigStore>((set) => ({
        model: initialModel,
        setModel: (model) => {
          set({ model: model });
        },
        getValues,
      })),
    [initialModel, getValues],
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
      'useModelParsedProject must be used within a ModelParsedProjectDefinitionProvider',
    );
  }
  return useStore(store, (state) => selector(state.getValues()));
}
