import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import AdminRoute from './components/AdminRoute'
import Agents from './pages/Agents'
import Verify from './pages/Verify'
import Home from './pages/Home'
import ModelCatalog from './pages/ModelCatalog'
import AIWizard from './pages/AIWizard'
import StarterPacks from './pages/StarterPacks'
import Economics from './pages/Economics'
import Admin from './pages/Admin'
import AdminNovaq from './pages/AdminNovaq'
import Subscription from './pages/Subscription'
import AgentCreator from './pages/AgentCreator'
import UserAgentCreator from './pages/UserAgentCreator'
import PerformanceDashboard from './pages/PerformanceDashboard'
import NOVAQDashboard from './pages/NOVAQDashboard'
import GoogleCallback from './pages/GoogleCallback'
import ModelChat from './pages/ModelChat'
import Coordinator from './pages/Coordinator'
import Landing from './pages/Landing'
import About from './pages/About'
import Pricing from './pages/Pricing'
import Features from './pages/Features'
import { AgentProvider } from './context/AgentContext'

// Development-only imports
let AuthTestComponent: React.LazyExoticComponent<React.ComponentType<any>> | null = null
if (import.meta.env.DEV) {
  import('./utils/adminTest')
  // Dynamically import auth test component for development
  AuthTestComponent = React.lazy(() => import('./components/AuthTestComponent'))
}

function App() {
  return (
    <AgentProvider>
      <Router>
          <div className="min-h-screen bg-primary text-text-on-dark relative overflow-hidden" role="main">
            <ParticleBackground />
            <div className="relative z-10">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  {/* Home page - always accessible */}
                  <Route path="/" element={<Home />} />
                  {/* Landing page - professional marketing site */}
                  <Route path="/landing" element={<Landing />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/pricing" element={<Pricing />} />
                  <Route path="/features" element={<Features />} />
                  
                  {/* User Routes - require authentication */}
                  <Route path="/starter-packs" element={
                    <ProtectedRoute>
                      <StarterPacks />
                    </ProtectedRoute>
                  } />
                  <Route path="/wizard" element={
                    <ProtectedRoute>
                      <AIWizard />
                    </ProtectedRoute>
                  } />
                  <Route path="/models" element={
                    <ProtectedRoute>
                      <ModelCatalog />
                    </ProtectedRoute>
                  } />
                  <Route path="/chat" element={
                    <ProtectedRoute>
                      <ModelChat />
                    </ProtectedRoute>
                  } />
                  <Route path="/coordinator" element={
                    <ProtectedRoute>
                      <Coordinator />
                    </ProtectedRoute>
                  } />
                  <Route path="/agents" element={
                    <ProtectedRoute>
                      <Agents />
                    </ProtectedRoute>
                  } />
                  <Route path="/economics" element={
                    <ProtectedRoute>
                      <Economics />
                    </ProtectedRoute>
                  } />
                  <Route path="/subscription" element={
                    <ProtectedRoute>
                      <Subscription />
                    </ProtectedRoute>
                  } />
                  <Route path="/create-agent" element={
                    <ProtectedRoute>
                      <UserAgentCreator />
                    </ProtectedRoute>
                  } />
                  <Route path="/agent-creator" element={
                    <ProtectedRoute>
                      <AgentCreator />
                    </ProtectedRoute>
                  } />
                  <Route path="/verify" element={
                    <ProtectedRoute>
                      <Verify />
                    </ProtectedRoute>
                  } />

                  {/* Admin Routes - require admin authentication */}
                  <Route path="/admin" element={
                    <AdminRoute>
                      <Admin />
                    </AdminRoute>
                  } />
                  <Route path="/admin/novaq" element={
                    <AdminRoute>
                      <AdminNovaq />
                    </AdminRoute>
                  } />
                  <Route path="/admin/performance" element={
                    <AdminRoute>
                      <PerformanceDashboard />
                    </AdminRoute>
                  } />
                  <Route path="/admin/novaq-dashboard" element={
                    <AdminRoute>
                      <NOVAQDashboard />
                    </AdminRoute>
                  } />
                  
                  {/* Google OAuth Callback - No authentication required */}
                  <Route path="/auth/google/callback" element={<GoogleCallback />} />
                  
                  {/* Development-only auth test route */}
                  {import.meta.env.DEV && AuthTestComponent && (
                    <Route path="/auth-test" element={
                      <React.Suspense fallback={<div className="text-center py-8">Loading...</div>}>
                        <AuthTestComponent />
                      </React.Suspense>
                    } />
                  )}
                  
                  {/* Fallback redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AgentProvider>
  )
}

export default App

