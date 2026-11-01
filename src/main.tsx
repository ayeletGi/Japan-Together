/// <reference types="vite/client" />
import React from 'react';
import ReactDOM from 'react-dom/client';
import '@fontsource/fredoka/hebrew-500.css';
import '@fontsource/fredoka/hebrew-600.css';
import '@fontsource/fredoka/latin-500.css';
import '@fontsource/fredoka/latin-600.css';
import '@fontsource/varela-round/hebrew-400.css';
import '@fontsource/varela-round/latin-400.css';
import './styles/index.css';
import './i18n';
import { App } from './app/App';
import { ErrorBoundary } from './app/ErrorBoundary';
import { applySavedTheme } from './app/theme';
import { startAppUpdates } from './lib/appUpdate';
import { startLiveSync } from './lib/liveSync';

applySavedTheme();
startLiveSync();

// Only the Cloudflare build (`npm run build:web`) ships sw.js; the artifact and offline copy don't.
if (import.meta.env.MODE === 'web' && 'serviceWorker' in navigator) {
  startAppUpdates();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
