import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Une PWA installée sert d'abord la version en cache. Sans ceci, après une mise
// à jour il fallait ouvrir l'app deux fois : la première installait la nouvelle
// version, la seconde seulement l'affichait. Le service worker prend la main dès
// son activation, on recharge donc une seule fois pour basculer immédiatement.
if ('serviceWorker' in navigator) {
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    window.location.reload();
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* BASE_URL vaut '/' en local et '/<nom-du-depot>/' sur GitHub Pages. */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
