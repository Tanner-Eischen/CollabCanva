import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import ErrorBoundary from './components/ErrorBoundary.tsx'

// Dev tools (browser console helpers)
if (import.meta.env.DEV) {
  import('./scripts/clearAssets').then(module => {
    console.log('🛠️ Dev tools loaded! Available commands:')
    console.log('  - window.clearAssets()       // Preview asset deletion (dry run)')
    console.log('  - window.clearAssets(false)  // Actually delete all assets (with confirmation)')
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)
