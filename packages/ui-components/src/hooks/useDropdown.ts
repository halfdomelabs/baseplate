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

type PopperProps =
  | MutableRefObject<HTMLDivElement | null>
  | CSSProperties
  | Record<string, string>
  | undefined;

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
  setReferenceElement: Dispatch<SetStateAction<T | null | undefined>>;
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
    setReferenceElement,
    popperProps: {
      ref: popperElementRef,
      style: styles.popper,
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
