import * as React from 'react';
import * as ReactDOM from 'react-dom/client';

import { App } from './app/app';

import './styles.css';

const rootElement = document.querySelector('#root');
if (!rootElement) throw new Error('Failed to find root element');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
