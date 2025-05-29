import * as React from 'react';
import * as ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';

import { router } from './pages/_routes.js';

import './styles.css';

const rootElement = document.querySelector('#root');
if (!rootElement) throw new Error('Failed to find root element');
const root = ReactDOM.createRoot(rootElement);

root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
