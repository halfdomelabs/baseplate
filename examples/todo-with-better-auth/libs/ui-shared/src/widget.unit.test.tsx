import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Widget } from './widget.js';

describe('Widget', () => {
  it('should render the provided label', () => {
    render(<Widget label="Hello" />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
