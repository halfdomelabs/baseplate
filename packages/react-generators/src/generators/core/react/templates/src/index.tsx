// @ts-nocheck

import React from 'react';
import ReactDOM from 'react-dom/client';

TPL_HEADER;

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <TPL_APP />
  </React.StrictMode>,
);
