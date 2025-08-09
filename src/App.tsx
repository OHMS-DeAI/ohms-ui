// import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Header from './components/Header'
import ProtectedRoute from './components/ProtectedRoute'
import Agents from './pages/Agents'
import Bounties from './pages/Bounties'
import Receipts from './pages/Receipts'
import Verify from './pages/Verify'
import Home from './pages/Home'
import ModelCatalog from './pages/ModelCatalog'
import AIWizard from './pages/AIWizard'
import StarterPacks from './pages/StarterPacks'
import Economics from './pages/Economics'
import { AgentProvider } from './context/AgentContext'

// Import admin test utility for development
if (import.meta.env.DEV) {
  import('./utils/adminTest')
}

function App() {
  return (
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
                
                {/* Protected routes - require authentication */}
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
                <Route path="/bounties" element={
                  <ProtectedRoute>
                    <Bounties />
                  </ProtectedRoute>
                } />
                <Route path="/economics" element={
                  <ProtectedRoute>
                    <Economics />
                  </ProtectedRoute>
                } />
                <Route path="/receipts" element={
                  <ProtectedRoute>
                    <Receipts />
                  </ProtectedRoute>
                } />
                <Route path="/verify" element={
                  <ProtectedRoute>
                    <Verify />
                  </ProtectedRoute>
                } />
                
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

