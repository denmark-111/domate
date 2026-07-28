import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

// Catch unhandled promise rejections globally
window.addEventListener('unhandledrejection', (event) => {
  console.warn('Unhandled promise rejection caught globally:', event.reason);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary title="Application Crashed" message="Domate encountered an unrecoverable error during execution.">
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

