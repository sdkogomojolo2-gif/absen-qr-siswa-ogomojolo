import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Register PWA Service Worker for offline support and asset caching
registerSW({ immediate: true });

// Safely catch benign browser unhandled promise rejections (e.g. Media/Audio autoplay interruptions, iframe navigation)
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason instanceof Error ? reason.message : String(reason || '');
    if (
      msg.includes('play()') ||
      msg.includes('user gesture') ||
      msg.includes('interrupted') ||
      msg.includes('media was removed') ||
      msg.includes('The play() request was interrupted') ||
      msg.includes('offline') ||
      msg.includes('failed to connect')
    ) {
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="Terjadi Kendala Memuat Aplikasi">
      <App />
    </ErrorBoundary>
  </StrictMode>
);

