import { useState } from 'react'
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
  const { isConnected, connect } = useAgent()
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const starterPacks: StarterPack[] = [
    {
      id: 'content-creator',
      title: 'Content Creator',
      description: 'Generate blog posts, social media content, and marketing copy',
      category: 'Content & Marketing',
      difficulty: 'Beginner',
      estimatedTime: '10-30 min',
      costRange: '100-500 ICP',
      tags: ['Writing', 'Marketing', 'SEO'],
      tasks: [
        'Blog post generation',
        'Social media captions',
        'Product descriptions',
        'Email newsletters',
        'SEO-optimized content'
      ],
      icon: '✍️',
      popular: true
    },
    {
      id: 'data-analyst',
      title: 'Data Analyst',
      description: 'Analyze datasets, create reports, and extract insights',
      category: 'Analytics & Reports',
      difficulty: 'Intermediate',
      estimatedTime: '30-60 min',
      costRange: '300-1000 ICP',
      tags: ['Analytics', 'Reports', 'Insights'],
      tasks: [
        'Data visualization',
        'Trend analysis',
        'Performance reporting',
        'KPI dashboards',
        'Statistical analysis'
      ],
      icon: '📊'
    },
    {
      id: 'code-reviewer',
      title: 'Code Reviewer',
      description: 'Review code quality, security, and best practices',
      category: 'Development',
      difficulty: 'Advanced',
      estimatedTime: '20-45 min',
      costRange: '400-800 ICP',
      tags: ['Code Review', 'Security', 'Quality'],
      tasks: [
        'Code quality assessment',
        'Security vulnerability scan',
        'Performance optimization',
        'Documentation review',
        'Best practices audit'
      ],
      icon: '🔍'
    },
    {
      id: 'business-advisor',
      title: 'Business Advisor',
      description: 'Strategic planning, market analysis, and business insights',
      category: 'Business Strategy',
      difficulty: 'Intermediate',
      estimatedTime: '45-90 min',
      costRange: '500-1500 ICP',
      tags: ['Strategy', 'Planning', 'Analysis'],
      tasks: [
        'Market research',
        'Competitive analysis',
        'Business plan creation',
        'Financial projections',
        'Risk assessment'
      ],
      icon: '💼',
      popular: true
    },
    {
      id: 'research-assistant',
      title: 'Research Assistant',
      description: 'Comprehensive research, fact-checking, and summary creation',
      category: 'Research & Education',
      difficulty: 'Beginner',
      estimatedTime: '15-45 min',
      costRange: '200-600 ICP',
      tags: ['Research', 'Fact-checking', 'Summaries'],
      tasks: [
        'Topic research',
        'Source verification',
        'Literature reviews',
        'Summary generation',
        'Citation formatting'
      ],
      icon: '🔬'
    },
    {
      id: 'creative-designer',
      title: 'Creative Designer',
      description: 'Design concepts, creative briefs, and visual planning',
      category: 'Design & Creative',
      difficulty: 'Intermediate',
      estimatedTime: '30-60 min',
      costRange: '400-1000 ICP',
      tags: ['Design', 'Creative', 'Branding'],
      tasks: [
        'Design brief creation',
        'Color palette suggestions',
        'Layout recommendations',
        'Brand strategy',
        'Creative concept development'
      ],
      icon: '🎨'
    },
    {
      id: 'customer-support',
      title: 'Customer Support',
      description: 'Help desk responses, FAQ creation, and support documentation',
      category: 'Customer Service',
      difficulty: 'Beginner',
      estimatedTime: '5-20 min',
      costRange: '50-300 ICP',
      tags: ['Support', 'Documentation', 'FAQ'],
      tasks: [
        'Support ticket responses',
        'FAQ generation',
        'User guide creation',
        'Troubleshooting steps',
        'Product documentation'
      ],
      icon: '🎧'
    },
    {
      id: 'financial-advisor',
      title: 'Financial Advisor',
      description: 'Financial analysis, budgeting, and investment insights',
      category: 'Finance & Accounting',
      difficulty: 'Advanced',
      estimatedTime: '45-90 min',
      costRange: '600-2000 ICP',
      tags: ['Finance', 'Budgeting', 'Analysis'],
      tasks: [
        'Budget analysis',
        'Investment research',
        'Financial modeling',
        'Risk assessment',
        'ROI calculations'
      ],
      icon: '💰'
    }
  ]

  const categories = ['all', ...new Set(starterPacks.map(pack => pack.category))]

  const filteredPacks = starterPacks.filter(pack => 
    selectedCategory === 'all' || pack.category === selectedCategory
  )

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'success'
      case 'Intermediate': return 'warning'
      case 'Advanced': return 'error'
      default: return 'default'
    }
  }

  const handleSelectPack = (pack: StarterPack) => {
    // Navigate to the wizard with pre-populated data
    navigate('/wizard', { 
      state: { 
        selectedPack: pack,
        prefilledGoal: `Use the ${pack.title} starter pack to help with my ${pack.category.toLowerCase()} needs`
      }
    })
  }

  if (!isConnected) {
    return (
      <div className="max-w-6xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">Starter Packs</h1>
          <p className="text-textOnDark/70 mb-6">Pre-configured AI agents for common tasks</p>
          <Button onClick={connect}>Connect to OHMS</Button>
        </Card>
      </div>
    )
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

      {/* Categories */}
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

      {/* Popular Packs */}
      {selectedCategory === 'all' && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-accentGold mb-4">🔥 Most Popular</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {starterPacks
              .filter(pack => pack.popular)
              .map((pack) => (
                <Card key={pack.id} hover className="relative">
                  <div className="absolute top-4 right-4">
                    <Badge variant="error" size="sm">Popular</Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-3xl mb-2">{pack.icon}</div>
                    <h3 className="text-lg font-semibold text-accentGold mb-2">
                      {pack.title}
                    </h3>
                    <p className="text-textOnDark/80 text-sm">
                      {pack.description}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap gap-1">
                      {pack.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} size="sm" variant="default">
                          {tag}
                        </Badge>
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-textOnDark/60">Time:</span>
                        <p className="text-textOnDark font-medium">{pack.estimatedTime}</p>
                      </div>
                      <div>
                        <span className="text-textOnDark/60">Cost:</span>
                        <p className="text-textOnDark font-medium">{pack.costRange}</p>
                      </div>
                    </div>

                    <Button 
                      fullWidth 
                      size="sm"
                      onClick={() => handleSelectPack(pack)}
                    >
                      Get Started
                    </Button>
                  </div>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Packs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPacks.map((pack) => (
          <Card key={pack.id} hover className="h-full">
            <div className="flex flex-col h-full">
              <div className="mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">{pack.icon}</div>
                  <Badge variant={getDifficultyColor(pack.difficulty)} size="sm">
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

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                  >
                    Preview
                  </Button>
                  <Button 
                    size="sm" 
                    className="flex-1"
                    onClick={() => handleSelectPack(pack)}
                  >
                    Use Pack
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPacks.length === 0 && (
        <Card className="text-center py-12">
          <p className="text-textOnDark/60 mb-4">
            No starter packs found in {selectedCategory}
          </p>
          <Button variant="ghost" onClick={() => setSelectedCategory('all')}>
            View All Categories
          </Button>
        </Card>
      )}

      {/* Custom Pack CTA */}
      <Card className="mt-8 bg-gradient-to-r from-accentGold/10 to-accentGold/5 border-accentGold/30">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-accentGold mb-2">
            Need something specific?
          </h3>
          <p className="text-textOnDark/80 mb-4">
            Create custom AI workflows tailored to your unique requirements
          </p>
          <Button onClick={() => navigate('/wizard')}>
            Create Custom Task
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default StarterPacks