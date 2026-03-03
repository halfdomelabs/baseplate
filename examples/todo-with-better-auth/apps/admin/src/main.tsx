import React from 'react';
import ReactDOM from 'react-dom/client';

import { App } from './app/app';

/* TPL_HEADER:START */
import './styles.css';
/* TPL_HEADER:END */

const rootElement = document.querySelector('#root');
if (!rootElement) {
  throw new Error('Failed to find the root element');
}
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    {/* TPL_APP:START */}
    <App />
    {/* TPL_APP:END */}
  </React.StrictMode>,
);
