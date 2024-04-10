import { useEffect } from 'react';
import { FieldValues, UseFormReturn } from 'react-hook-form';
import { create } from 'zustand';

interface UseDirtyFormState {
  dirtyForm: boolean;
  setDirtyForm: (dirtyForm: boolean) => void;
}

export const useDirtyFormState = create<UseDirtyFormState>((set) => ({
  dirtyForm: false,
  setDirtyForm: (dirtyForm) => set({ dirtyForm }),
}));

export function usePreventDirtyForm<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
>(form: UseFormReturn<TFieldValues, TContext>): null {
  const setDirtyForm = useDirtyFormState((state) => state.setDirtyForm);
  const { formState } = form;

  useEffect(() => {
    const isDirty = Object.keys(formState.dirtyFields).length > 0;
    const { isDirty: formStateIsDirty } = formState;
    console.debug({ isDirty, formStateIsDirty });
    setDirtyForm(isDirty);
    return () => {
      setDirtyForm(false);
    };
  }, [formState, setDirtyForm]);

  return null;
}

export function useDirtyForm(): boolean {
  const dirtyForm = useDirtyFormState((state) => state.dirtyForm);

  return dirtyForm;
}

export function formIsDirty<
  TFieldValues extends FieldValues = FieldValues,
  TContext = unknown,
>(form: UseFormReturn<TFieldValues, TContext>): boolean {
  const { formState } = form;
  return Object.keys(formState.dirtyFields).length > 0;
}
