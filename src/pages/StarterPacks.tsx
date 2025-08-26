import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card from '../components/Card'
import Button from '../components/Button'
import Badge from '../components/Badge'
import { useAgent } from '../context/AgentContext'

interface StarterPack {
  id: string
  title: string
  description: string
  category: string
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  estimatedTime: string
  costRange: string
  tags: string[]
  tasks: string[]
  icon: string
  popular?: boolean
}

const StarterPacks = () => {
  const { isConnected } = useAgent()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [starterPacks, setStarterPacks] = useState<StarterPack[]>([])
  const [loading, setLoading] = useState(false)

  // Auto-load starter packs when connected
  useEffect(() => {
    if (isConnected) {
      fetchStarterPacks()
    }
  }, [isConnected])

  const fetchStarterPacks = async () => {
    setLoading(true)
    try {
      // TODO: Implement API call to fetch starter packs from canister
      // For now, keep empty until real API is implemented
      setStarterPacks([])
    } catch (error) {
      // Removed console log
    } finally {
      setLoading(false)
    }
  }

  const categories = ['all', ...new Set(starterPacks.map(pack => pack.category))]
  
  const filteredPacks = starterPacks.filter(pack => 
    selectedCategory === 'all' || pack.category === selectedCategory
  )

  const handleCreateCustomTask = () => {
    navigate('/wizard')
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accentGold mb-2">Starter Packs</h1>
        <p className="text-textOnDark/70">
          Pre-configured AI agents and workflows for common business tasks. 
          Get started quickly with proven templates.
        </p>
      </div>

      {/* Categories - Only show if we have packs */}
      {starterPacks.length > 0 && (
        <Card className="mb-6">
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'All Categories' : category}
              </Button>
            ))}
          </div>
          <div className="mt-4 text-sm text-textOnDark/60">
            {filteredPacks.length} starter packs available
          </div>
        </Card>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-8 h-8 border border-accentGold border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-textOnDark/70">Loading starter packs...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && starterPacks.length === 0 && (
        <div className="text-center py-16">
          <div className="w-24 h-24 mx-auto mb-6 bg-accentGold/20 rounded-full flex items-center justify-center">
            <svg className="w-12 h-12 text-accentGold" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          
          <h3 className="text-2xl font-bold text-accentGold mb-4">
            Starter Packs Coming Soon
          </h3>
          <p className="text-textOnDark/70 mb-8 max-w-md mx-auto">
            We're preparing pre-configured AI workflows to help you get started quickly. 
            In the meantime, create custom AI tasks tailored to your needs.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={handleCreateCustomTask} size="lg">
              🚀 Create Custom Task
            </Button>
            <Button variant="outline" onClick={() => navigate('/wizard')} size="lg">
              🧙‍♂️ Try AI Wizard
            </Button>
          </div>
        </div>
      )}

      {/* Starter Packs Grid - Only show if we have packs */}
      {!loading && starterPacks.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.map((pack) => (
            <Card key={pack.id} hover className="h-full">
              <div className="flex flex-col h-full">
                <div className="mb-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="text-3xl">{pack.icon}</div>
                    <Badge variant="default" size="sm">
                      {pack.difficulty}
                    </Badge>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-accentGold mb-2">
                    {pack.title}
                  </h3>
                  <p className="text-textOnDark/80 text-sm mb-3">
                    {pack.description}
                  </p>
                  <p className="text-xs text-textOnDark/60">
                    {pack.category}
                  </p>
                </div>

                <div className="space-y-4 flex-grow">
                  <div>
                    <h4 className="text-sm font-medium text-textOnDark mb-2">Included Tasks:</h4>
                    <ul className="text-xs text-textOnDark/70 space-y-1">
                      {pack.tasks.slice(0, 3).map((task, index) => (
                        <li key={index} className="flex items-center">
                          <span className="w-1.5 h-1.5 bg-accentGold rounded-full mr-2 flex-shrink-0" />
                          {task}
                        </li>
                      ))}
                      {pack.tasks.length > 3 && (
                        <li className="text-accentGold">
                          +{pack.tasks.length - 3} more tasks
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {pack.tags.map((tag) => (
                      <Badge key={tag} size="sm" variant="default">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-accentGold/20 mt-4">
                  <div className="grid grid-cols-2 gap-4 text-xs mb-4">
                    <div>
                      <span className="text-textOnDark/60">Est. Time:</span>
                      <p className="text-textOnDark font-medium">{pack.estimatedTime}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Cost Range:</span>
                      <p className="text-textOnDark font-medium">{pack.costRange}</p>
                    </div>
                  </div>

                  <Button size="sm" fullWidth>
                    Use This Pack
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* No results for category filter */}
      {!loading && starterPacks.length > 0 && filteredPacks.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-textOnDark/60 mb-4">
            No starter packs found in {selectedCategory}
          </p>
          <Button variant="ghost" onClick={() => setSelectedCategory('all')}>
            View All Categories
          </Button>
        </Card>
      )}

      {/* Custom Pack CTA - Always show */}
      <Card className="mt-8 bg-gradient-to-r from-accentGold/10 to-accentGold/5 border-accentGold/30">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-accentGold mb-2">
            Need something specific?
          </h3>
          <p className="text-textOnDark/80 mb-4">
            Create custom AI workflows tailored to your unique requirements
          </p>
          <Button onClick={handleCreateCustomTask}>
            Create Custom Task
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default StarterPacks