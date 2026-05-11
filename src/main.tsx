import {StrictMode} from 'react';
// @ts-ignore
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// @ts-ignore
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
