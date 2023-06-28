import { ModifierPhases, VirtualElement } from '@popperjs/core/index.js';
import {
  CSSProperties,
  Dispatch,
  MutableRefObject,
  SetStateAction,
  useMemo,
  useState,
} from 'react';
import { Modifier, usePopper } from 'react-popper';

type PopperProps =
  | MutableRefObject<HTMLDivElement | null>
  | {
      [key: string]: CSSProperties | string;
    };

interface TransitionProps {
  beforeEnter: () => void;
  afterLeave: () => void;
  enter: string;
  enterFrom: string;
  enterTo: string;
  leave: string;
  leaveFrom: string;
  leaveTo: string;
}

interface UseDropdownResult<T> {
  popperProps: Record<string, PopperProps>;
  transitionProps: TransitionProps;
  attributes: {
    [key: string]:
      | {
          [key: string]: string;
        }
      | undefined;
  };
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
  popperElementRef: MutableRefObject<HTMLDivElement | null>;
  modifiers?: Modifier<'offset' | 'sameWidth'>[];
  fixed?: boolean;
}

export function useDropdown<T extends VirtualElement>({
  modifiers,
  fixed,
  popperElementRef,
}: UseDropdownProps): UseDropdownResult<T> {
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
    referenceElement,
    setReferenceElement,
    setPopperElement,
    styles,
    popperProps: {
      ref: popperElementRef,
      style: styles,
      ...attributes,
    },
    transitionProps: {
      beforeEnter: () => setPopperElement(popperElementRef.current),
      afterLeave: () => setPopperElement(null),
      enter: 'ease-out duration-100',
      enterFrom: 'opacity-0 scale-95',
      enterTo: 'opacity-100 scale-100',
      leave: 'ease-in duration-100',
      leaveFrom: 'opacity-100 scale-100',
      leaveTo: 'opacity-0 scale-95',
    },
  };
}
