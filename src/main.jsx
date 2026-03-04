import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// FIX: registra il SW dopo il load per non ritardare il primo rendering
// FIX: logga gli errori invece di sopprimerli silenziosamente
window.addEventListener('load', () => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.error('[SW] Registrazione fallita:', err);
    });
  }
});

createRoot(document.getElementById('root')).render(<App />);
