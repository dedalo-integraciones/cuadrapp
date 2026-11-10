import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminPanel from './pages/AdminPanel';
import './index.css';

const esPanelAdmin = /^\/admin(?:\/.*)?$/i.test(window.location.pathname);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {esPanelAdmin ? <AdminPanel /> : <App />}
  </StrictMode>,
);
