import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeExtensionErrorSupport } from './utils/extensionErrorSupport'
import { installConsoleErrorFilter } from './utils/consoleErrorFilter'

// Initialize extension error support for legacy wallet extension noise (kept for Brave guidance)
initializeExtensionErrorSupport()

// Install console error filtering to suppress extension errors
installConsoleErrorFilter()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
