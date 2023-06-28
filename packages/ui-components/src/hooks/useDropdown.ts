import { ModifierPhases, VirtualElement } from '@popperjs/core/index.js';
import {
  CSSProperties,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Modifier, usePopper } from 'react-popper';

interface UseDropdownResult<T> {
  attributes: {
    [key: string]:
      | {
          [key: string]: string;
        }
      | undefined;
  };
  popperElement: HTMLDivElement | null | undefined;
  popperElementRef: MutableRefObject<HTMLDivElement | null>;
  referenceElement: T | null | undefined;
  setReferenceElement: Dispatch<SetStateAction<T | null | undefined>>;
  setPopperElement: (
    value: SetStateAction<HTMLDivElement | null | undefined>
  ) => void;
  styles: {
    [key: string]: CSSProperties;
  };
}

interface UseDropdownProps {
  modifiers?: Modifier<'offset' | 'sameWidth'>[];
  fixed?: boolean;
}

export function useDropdown<T extends VirtualElement>({
  modifiers,
  fixed,
}: UseDropdownProps): UseDropdownResult<T> {
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<T | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();

  const defaultModifiers: Modifier<'offset' | 'sameWidth'>[] = useMemo(
    () => [
      { name: 'offset', options: { offset: [0, 8] } },
      {
        name: 'sameWidth',
        enabled: true,
        phase: 'beforeWrite' as ModifierPhases,
        requires: ['computeStyles'],
        fn({ state: draftState }) {
          draftState.styles.popper.minWidth = `${draftState.rects.reference.width}px`;
        },
        effect({ state: draftState }) {
          draftState.elements.popper.style.minWidth = `${
            (draftState.elements.reference as HTMLDivElement).offsetWidth
          }px`;
        },
      },
    ],
    []
  );

  const { styles, attributes } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-end',
    modifiers: modifiers || defaultModifiers,
    strategy: fixed ? 'fixed' : undefined,
  });

  return {
    attributes,
    popperElement,
    popperElementRef,
    referenceElement,
    setReferenceElement,
    setPopperElement,
    styles,
  };
}
