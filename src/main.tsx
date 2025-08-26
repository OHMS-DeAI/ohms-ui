import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initializeExtensionErrorSupport } from './utils/extensionErrorSupport'
import { installConsoleErrorFilter } from './utils/consoleErrorFilter'
import { fixAriaHiddenIssue } from './utils/accessibilityFix'
import { disableProductionLogging } from './utils/secureLogger'

// Initialize security measures
disableProductionLogging()

// Initialize extension error support for legacy wallet extension noise (kept for Brave guidance)
initializeExtensionErrorSupport()

// Install console error filtering to suppress extension errors
installConsoleErrorFilter()

// Fix aria-hidden accessibility issue
fixAriaHiddenIssue()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
