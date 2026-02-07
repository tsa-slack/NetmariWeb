import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App.tsx';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={GlobalErrorBoundary}>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
