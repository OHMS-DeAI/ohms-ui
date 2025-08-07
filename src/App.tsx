// import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ParticleBackground from './components/ParticleBackground'
import Header from './components/Header'
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
                <Route path="/" element={<Home />} />
                <Route path="/starter-packs" element={<StarterPacks />} />
                <Route path="/wizard" element={<AIWizard />} />
                <Route path="/models" element={<ModelCatalog />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/bounties" element={<Bounties />} />
                <Route path="/economics" element={<Economics />} />
                <Route path="/receipts" element={<Receipts />} />
                <Route path="/verify" element={<Verify />} />
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