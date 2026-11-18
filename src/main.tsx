import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import AdminPanel from './pages/AdminPanel';
import RecuperarClave from './pages/RecuperarClave';
import RestablecerClave from './pages/RestablecerClave';
import Terminos from './pages/Terminos';
import Privacidad from './pages/Privacidad';
import './index.css';

const ruta = window.location.pathname.replace(/\/+$/, '') || '/';
const esPanelAdmin = /^\/admin(?:\/.*)?$/i.test(ruta);
const esRecuperarClave = /^\/recuperar-clave$/i.test(ruta);
const esRestablecerClave = /^\/restablecer-clave$/i.test(ruta);
const esTerminos = /^\/terminos$/i.test(ruta);
const esPrivacidad = /^\/privacidad$/i.test(ruta);

const vista = esPanelAdmin ? (
  <AdminPanel />
) : esRecuperarClave ? (
  <RecuperarClave />
) : esRestablecerClave ? (
  <RestablecerClave />
) : esTerminos ? (
  <Terminos />
) : esPrivacidad ? (
  <Privacidad />
) : (
  <App />
);

createRoot(document.getElementById('root')!).render(<StrictMode>{vista}</StrictMode>);
