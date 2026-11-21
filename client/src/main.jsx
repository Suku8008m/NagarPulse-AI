import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Filter out noisy third-party browser extension disconnect errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('Receiving end does not exist') ||
      event.filename?.includes('extension') ||
      event.filename?.includes('v4brftbt4')
    ) {
      event.stopImmediatePropagation();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('Receiving end does not exist') ||
      event.reason?.message?.includes('Could not establish connection')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
