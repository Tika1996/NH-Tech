import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { LanguageProvider } from './lib/i18n';
import { ToastProvider } from './lib/ToastContext';
import { CartProvider } from './lib/CartContext';
import App from './App';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <LanguageProvider>
        <ToastProvider>
          <CartProvider>
            <App />
          </CartProvider>
        </ToastProvider>
      </LanguageProvider>
    </HashRouter>
  </StrictMode>
);
