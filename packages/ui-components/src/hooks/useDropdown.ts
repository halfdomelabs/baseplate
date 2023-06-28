import { ModifierPhases } from '@popperjs/core/index.js';
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
  popperElementRef: MutableRefObject<HTMLDivElement | null>;
  referenceElement: T | null | undefined;
  setReferenceElement: Dispatch<SetStateAction<T | null | undefined>>;
  setPopperElement: (
    value: SetStateAction<HTMLDivElement | null | undefined>
  ) => void;
  popperElement: HTMLDivElement | null | undefined;
  styles: {
    [key: string]: CSSProperties;
  };
}

interface UseDropdownProps {
  useSameWidthModifier?: boolean;
  modifiers?: {
    offset?: Modifier<'offset'>;
    sameWidth?: Modifier<'sameWidth'>;
  };
  fixed?: boolean;
}

export function useDropdown<T>({
  useSameWidthModifier,
  modifiers,
  fixed,
}: UseDropdownProps): UseDropdownResult<T> {
  const popperElementRef = useRef<HTMLDivElement | null>(null);
  const [referenceElement, setReferenceElement] = useState<T | null>();
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>();

  return {
    // attributes,
    popperElement,
    popperElementRef,
    referenceElement,
    setReferenceElement,
    setPopperElement,
    // styles,
  };
}
