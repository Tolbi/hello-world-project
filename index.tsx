import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Global shim for process
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || {};
  
  if (!(window as any).process.env.NODE_ENV) {
    (window as any).process.env.NODE_ENV = 'production';
  }
  
  const isSecurityError = (msg: any) => {
    const s = String(msg || '');
    return /Location|cross-origin|SecurityError|href|named property|blocked a frame/i.test(s);
  };

  const errorSuppressor = (event: ErrorEvent | PromiseRejectionEvent) => {
    const errorMsg = 'message' in event ? event.message : (event as any).reason;
    if (isSecurityError(errorMsg)) {
      if (event.stopImmediatePropagation) event.stopImmediatePropagation();
      if (event.stopPropagation) event.stopPropagation();
      event.preventDefault();
      return true;
    }
  };

  window.addEventListener('error', errorSuppressor, true);
  window.addEventListener('unhandledrejection', errorSuppressor as any, true);
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);