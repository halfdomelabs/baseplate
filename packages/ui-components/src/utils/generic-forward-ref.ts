import React, { forwardRef } from 'react';

/**
 * Typed wrapper around forwardRef for generic components
 *
 * Taken from https://fettblog.eu/typescript-react-generic-forward-refs/
 */

// eslint-disable-next-line @typescript-eslint/ban-types
export function genericForwardRef<T, P = {}>(
  render: (props: P, ref: React.Ref<T>) => React.ReactElement | null,
  displayName?: string,
): (props: P & React.RefAttributes<T>) => React.ReactElement | null {
  const newElem = forwardRef(render) as (
    props: P & React.RefAttributes<T>,
  ) => React.ReactElement | null;

  if (displayName) {
    (newElem as { displayName?: string }).displayName = displayName;
  }

  return newElem;
}
