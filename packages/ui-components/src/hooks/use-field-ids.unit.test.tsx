import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { useFieldIds } from './use-field-ids.js';

describe('useFieldIds', () => {
  it('describes nothing when there is no description or error', () => {
    const { result } = renderHook(() => useFieldIds());

    expect(result.current.describedBy).toBeUndefined();
    expect(result.current.controlProps['aria-describedby']).toBeUndefined();
  });

  it('references only the slots that have content', () => {
    const { result } = renderHook(() => useFieldIds({ description: 'Help' }));

    expect(result.current.describedBy).toBe(result.current.descriptionId);
  });

  it('appends the error id after the description id', () => {
    const { result } = renderHook(() =>
      useFieldIds({ description: 'Help', error: 'Bad' }),
    );

    const { descriptionId, errorId, describedBy } = result.current;
    expect(describedBy).toBe(`${descriptionId} ${errorId}`);
  });

  it('keeps a consumer-supplied aria-describedby ahead of the generated ids', () => {
    const { result } = renderHook(() =>
      useFieldIds({
        'aria-describedby': 'outside-hint',
        description: 'Help',
        error: 'Bad',
      }),
    );

    const { descriptionId, errorId, describedBy } = result.current;
    expect(describedBy).toBe(`outside-hint ${descriptionId} ${errorId}`);
  });

  it('uses a consumer-supplied id for both the control and the label', () => {
    const { result } = renderHook(() => useFieldIds({ id: 'my-field' }));

    expect(result.current.controlProps.id).toBe('my-field');
    expect(result.current.labelProps.htmlFor).toBe('my-field');
  });
});
