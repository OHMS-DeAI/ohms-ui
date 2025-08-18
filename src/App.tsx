// import React from 'react'
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
import { AgentProvider } from './context/AgentContext'
import { IdentityKitProvider, IdentityKitTheme } from '@nfid/identitykit/react'
import { OISY } from '@nfid/identitykit'
import '@nfid/identitykit/react/styles.css'

// Import admin test utility for development
if (import.meta.env.DEV) {
  import('./utils/adminTest')
}

function App() {
  return (
    <IdentityKitProvider signers={[OISY]} authType="ACCOUNTS" theme={IdentityKitTheme.DARK}>
      <AgentProvider>
        <Router>
          <div className="min-h-screen bg-primary text-text-on-dark relative overflow-hidden">
            <ParticleBackground />
            <div className="relative z-10">
              <Header />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  {/* Home page - always accessible */}
                  <Route path="/" element={<Home />} />
                  
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
                  
                  {/* Fallback redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
            </div>
          </div>
        </Router>
      </AgentProvider>
    </IdentityKitProvider>
  )
}

export default App

