import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import App from './app/App';

import './index.css';
import '@halfdomelabs/ui-components/global.css';

const root = ReactDOM.createRoot(document.getElementById('root')!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
