import { useEffect, useRef } from 'react';
import { FieldValues, FormState, UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';

interface FormDirtyState {
  dirtyFormsIds: Set<number>;
  idCounter: number;
  incIdCounter: () => void;
  registerId: (id: number) => void;
  unregisterId: (id: number) => void;
}

export const useFormDirtyState = create<FormDirtyState>((set) => ({
  dirtyFormsIds: new Set(),
  idCounter: 0,
  incIdCounter: () => set((state) => ({ idCounter: state.idCounter + 1 })),
  registerId: (id: number) =>
    set((state) => ({ dirtyFormsIds: new Set(state.dirtyFormsIds).add(id) })),
  unregisterId: (id: number) =>
    set((state) => {
      const newDirtyForms = new Set(state.dirtyFormsIds);
      newDirtyForms.delete(id);
      return { dirtyFormsIds: newDirtyForms };
    }),
}));

function useUniqueFormId(): number {
  const idCounter = useFormDirtyState((state) => state.idCounter);
  const incIdCounter = useFormDirtyState((state) => state.incIdCounter);

  const formId = useRef<number>(idCounter);

  useEffect(() => {
    if (formId.current >= idCounter) {
      incIdCounter();
    }
  }, [idCounter, incIdCounter]);

  return formId.current;
}

export function usePreventDirtyForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
>(form: UseFormReturn<TFieldValues, TContext>): null {
  const registerId = useFormDirtyState((state) => state.registerId);
  const unregisterId = useFormDirtyState((state) => state.unregisterId);

  const formId = useUniqueFormId();

  // this destructuring is needed for proper state updates
  const { formState } = form;

  useEffect(() => {
    if (formIsDirty({ formState })) {
      registerId(formId);
    }

    return () => {
      unregisterId(formId);
    };
  }, [formId, formState, registerId, unregisterId]);

  return null;
}

export function useDirtyFormsExist(): boolean {
  const dirtyForms = useFormDirtyState((state) => state.dirtyFormsIds);

  return dirtyForms.size > 0;
}

export function formIsDirty<
  TFieldValues extends FieldValues = FieldValues,
>(form: { formState: FormState<TFieldValues> }): boolean {
  const { formState } = form;
  return Object.keys(formState.dirtyFields).length > 0;
}
