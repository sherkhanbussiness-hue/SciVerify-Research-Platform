import { createRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';

// Suppress benign browser ResizeObserver loop messages that trigger intrusive overlays
window.addEventListener('error', (event) => {
  if (
    event.message &&
    (event.message.includes('ResizeObserver loop completed with undelivered notifications') ||
      event.message.includes('ResizeObserver loop limit exceeded'))
  ) {
    event.stopImmediatePropagation();
  }
});

createRoot(document.getElementById('root')!, {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
  onUncaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>,
);
