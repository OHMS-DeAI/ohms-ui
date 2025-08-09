import { useState } from 'react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Textarea from '../components/Textarea'
import Badge from '../components/Badge'
import LoadingSpinner from '../components/LoadingSpinner'
import { useAgent } from '../context/AgentContext'

interface WizardStep {
  id: string
  title: string
  description: string
}

interface TaskRequest {
  goal: string
  tone: 'professional' | 'casual' | 'creative' | 'technical'
  context: string
  outputFormat: 'text' | 'report' | 'list' | 'code'
  urgency: 'low' | 'medium' | 'high'
  budget: number
}

const AIWizard = () => {
  const { isPlugAvailable } = useAgent()
  const [currentStep, setCurrentStep] = useState(0)
  const [taskRequest, setTaskRequest] = useState<TaskRequest>({
    goal: '',
    tone: 'professional',
    context: '',
    outputFormat: 'text',
    urgency: 'medium',
    budget: 500
  })
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [recommendedAgent, setRecommendedAgent] = useState<any>(null)

  const steps: WizardStep[] = [
    {
      id: 'goal',
      title: 'What do you want to accomplish?',
      description: 'Describe your task in simple terms'
    },
    {
      id: 'details',
      title: 'Provide more details',
      description: 'Help us understand the context and requirements'
    },
    {
      id: 'preferences',
      title: 'Set your preferences',
      description: 'Choose tone, format, and urgency'
    },
    {
      id: 'review',
      title: 'Review and Submit',
      description: 'Confirm your request and get an estimate'
    }
  ]

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setIsProcessing(true)
    
    try {
      // Simulate agent matching and task processing
      await new Promise(resolve => setTimeout(resolve, 3000))
      
      // Mock agent recommendation
      setRecommendedAgent({
        agent_id: 'agent_wizard_001',
        capabilities: ['text-generation', 'analysis', 'professional-writing'],
        reputation: 4.8,
        estimated_time: '15-30 minutes',
        cost_estimate: taskRequest.budget
      })
      
      // Mock result
      setResult({
        task_id: `task_${Date.now()}`,
        status: 'completed',
        output: generateMockOutput(taskRequest),
        execution_time: 23,
        actual_cost: taskRequest.budget * 0.85
      })
    } catch (error) {
      console.error('Task processing failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const generateMockOutput = (request: TaskRequest) => {
    const outputs = {
      'business-plan': `# Business Plan Executive Summary

Based on your requirements, here's a comprehensive business plan outline:

## Market Analysis
The target market shows strong growth potential with increasing demand for AI-powered solutions. Market size is estimated at $2.3B with 15% YoY growth.

## Financial Projections
- Year 1: $50K revenue, 35% gross margin
- Year 2: $150K revenue, 45% gross margin  
- Year 3: $400K revenue, 55% gross margin

## Key Strategies
1. Focus on enterprise customers
2. Build strategic partnerships
3. Invest in product development
4. Scale marketing efforts

## Risk Mitigation
- Diversify customer base
- Monitor competitive landscape
- Maintain cash reserves
- Regular product updates`,

      'content-creation': `# Content Strategy Recommendations

## Blog Post Ideas
1. "10 Ways AI is Transforming Modern Business"
2. "The Future of Remote Work: Trends and Predictions"
3. "Sustainable Business Practices for 2025"

## Social Media Content
- Weekly industry insights
- Behind-the-scenes content
- Customer success stories
- Educational tutorials

## Email Campaigns
- Welcome series for new subscribers
- Monthly newsletter with industry updates
- Product announcement sequences
- Re-engagement campaigns

## SEO Keywords
- Primary: "AI business solutions"
- Secondary: "automation tools", "digital transformation"
- Long-tail: "how to implement AI in small business"`,

      'data-analysis': `# Data Analysis Report

## Key Findings
- 67% increase in user engagement over the last quarter
- Mobile traffic now represents 72% of total visits
- Conversion rate improved by 23% after recent changes

## Recommendations
1. **Mobile Optimization**: Continue investing in mobile experience
2. **Content Strategy**: Focus on high-engagement content types
3. **User Journey**: Streamline the conversion funnel
4. **A/B Testing**: Implement continuous testing program

## Metrics to Monitor
- Monthly Active Users (MAU)
- Customer Acquisition Cost (CAC)
- Lifetime Value (LTV)
- Churn Rate

## Next Steps
- Implement tracking for micro-conversions
- Set up automated reporting dashboard
- Schedule monthly review meetings`
    }

    // Return appropriate output based on goal keywords
    if (request.goal.toLowerCase().includes('business') || request.goal.toLowerCase().includes('plan')) {
      return outputs['business-plan']
    } else if (request.goal.toLowerCase().includes('content') || request.goal.toLowerCase().includes('write')) {
      return outputs['content-creation']
    } else if (request.goal.toLowerCase().includes('data') || request.goal.toLowerCase().includes('analyz')) {
      return outputs['data-analysis']
    }
    
    return `# Task Completion Report

Based on your request: "${request.goal}"

## Output
I've analyzed your requirements and here's my response tailored to your ${request.tone} tone preference:

${request.context ? `Given the context: "${request.context}"` : ''}

## Key Points
- Comprehensive analysis completed
- Recommendations provided
- Action items identified
- Next steps outlined

## Summary
This ${request.outputFormat} addresses your specific needs while maintaining a ${request.tone} approach. The solution is designed to meet your ${request.urgency} priority requirements.

*Task completed in 23 minutes with 99.2% accuracy*`
  }

  const resetWizard = () => {
    setCurrentStep(0)
    setTaskRequest({
      goal: '',
      tone: 'professional',
      context: '',
      outputFormat: 'text',
      urgency: 'medium',
      budget: 500
    })
    setResult(null)
    setRecommendedAgent(null)
    setIsProcessing(false)
  }

  if (!isPlugAvailable) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <h1 className="text-3xl font-bold text-accentGold mb-4">AI Task Wizard</h1>
          <p className="text-textOnDark/70 mb-6">Install Plug wallet to start creating AI-powered tasks</p>
        </Card>
      </div>
    )
  }

  if (result) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-accentGold mb-2">Task Completed!</h2>
            <p className="text-textOnDark/70">Your AI agent has successfully completed the task</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/40 rounded border border-accentGold/20">
              <p className="text-accentGold font-semibold">Execution Time</p>
              <p className="text-2xl font-bold text-textOnDark">{result.execution_time}m</p>
            </div>
            <div className="text-center p-4 bg-primary/40 rounded border border-accentGold/20">
              <p className="text-accentGold font-semibold">Cost</p>
              <p className="text-2xl font-bold text-textOnDark">{result.actual_cost} ICP</p>
            </div>
            <div className="text-center p-4 bg-primary/40 rounded border border-accentGold/20">
              <p className="text-accentGold font-semibold">Agent Rating</p>
              <p className="text-2xl font-bold text-textOnDark">{recommendedAgent?.reputation}/5</p>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-accentGold mb-3">Output</h3>
            <div className="bg-primary/40 rounded border border-accentGold/20 p-4 max-h-96 overflow-y-auto">
              <pre className="text-sm text-textOnDark whitespace-pre-wrap font-mono">
                {result.output}
              </pre>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" fullWidth onClick={resetWizard}>
              Create Another Task
            </Button>
            <Button fullWidth>
              Download Result
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="text-center py-12">
          <LoadingSpinner size="lg" className="mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-accentGold mb-4">Processing Your Task</h2>
          <div className="space-y-3 text-textOnDark/70">
            <p>🔍 Finding the best AI agent for your task...</p>
            <p>⚡ Executing your request with optimal parameters...</p>
            <p>📊 Generating high-quality output...</p>
          </div>
          {recommendedAgent && (
            <div className="mt-6 p-4 bg-primary/40 rounded border border-accentGold/20 inline-block">
              <p className="text-sm text-accentGold mb-2">Selected Agent:</p>
              <p className="font-semibold">{recommendedAgent.agent_id}</p>
              <div className="flex gap-2 mt-2 justify-center">
                {recommendedAgent.capabilities.map((cap: string) => (
                  <Badge key={cap} size="sm">{cap}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-accentGold mb-2">AI Task Wizard</h1>
        <p className="text-textOnDark/70">Create AI-powered tasks in minutes with our guided wizard</p>
      </div>

      {/* Progress Bar */}
      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-textOnDark/60">
            Step {currentStep + 1} of {steps.length}
          </span>
          <span className="text-sm text-textOnDark/60">
            {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
          </span>
        </div>
        <div className="w-full bg-primary/40 rounded-full h-2">
          <div
            className="bg-accentGold h-2 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
          />
        </div>
      </Card>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-accentGold mb-2">
            {steps[currentStep].title}
          </h2>
          <p className="text-textOnDark/70">{steps[currentStep].description}</p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Goal */}
          {currentStep === 0 && (
            <div className="space-y-4">
              <Textarea
                label="Describe your task"
                value={taskRequest.goal}
                onChange={(e) => setTaskRequest(prev => ({ ...prev, goal: e.target.value }))}
                placeholder="I need help with..."
                rows={4}
                helperText="Be as specific as possible about what you want to accomplish"
              />
              
              <div>
                <h4 className="text-textOnDark font-medium mb-3">Quick Templates</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Write a business plan for my startup',
                    'Analyze my website traffic data',
                    'Create content for my blog',
                    'Review and improve my code',
                    'Generate product descriptions',
                    'Summarize research papers'
                  ].map((template) => (
                    <Button
                      key={template}
                      variant="ghost"
                      size="sm"
                      className="text-left justify-start h-auto p-3"
                      onClick={() => setTaskRequest(prev => ({ ...prev, goal: template }))}
                    >
                      {template}
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Details */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <Textarea
                label="Additional Context"
                value={taskRequest.context}
                onChange={(e) => setTaskRequest(prev => ({ ...prev, context: e.target.value }))}
                placeholder="Provide any relevant background information, constraints, or specific requirements..."
                rows={4}
                helperText="The more context you provide, the better the result will be"
              />
            </div>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 2 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-textOnDark mb-3">Tone</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'professional', label: 'Professional', desc: 'Formal and business-like' },
                    { value: 'casual', label: 'Casual', desc: 'Friendly and conversational' },
                    { value: 'creative', label: 'Creative', desc: 'Innovative and expressive' },
                    { value: 'technical', label: 'Technical', desc: 'Precise and detailed' }
                  ].map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => setTaskRequest(prev => ({ ...prev, tone: tone.value as any }))}
                      className={`p-3 rounded border text-left transition-all ${
                        taskRequest.tone === tone.value
                          ? 'border-accentGold bg-accentGold/10 text-accentGold'
                          : 'border-accentGold/20 hover:border-accentGold/40'
                      }`}
                    >
                      <p className="font-medium">{tone.label}</p>
                      <p className="text-xs text-textOnDark/60">{tone.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-textOnDark mb-3">Output Format</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                    { value: 'text', label: 'Text', desc: 'Plain text response' },
                    { value: 'report', label: 'Report', desc: 'Structured document' },
                    { value: 'list', label: 'List', desc: 'Bullet points or steps' },
                    { value: 'code', label: 'Code', desc: 'Code snippets' }
                  ].map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setTaskRequest(prev => ({ ...prev, outputFormat: format.value as any }))}
                      className={`p-3 rounded border text-left transition-all ${
                        taskRequest.outputFormat === format.value
                          ? 'border-accentGold bg-accentGold/10 text-accentGold'
                          : 'border-accentGold/20 hover:border-accentGold/40'
                      }`}
                    >
                      <p className="font-medium">{format.label}</p>
                      <p className="text-xs text-textOnDark/60">{format.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-textOnDark mb-2">Urgency</label>
                  <select
                    value={taskRequest.urgency}
                    onChange={(e) => setTaskRequest(prev => ({ ...prev, urgency: e.target.value as any }))}
                    className="w-full px-3 py-2 bg-primary/60 border border-accentGold/40 rounded-lg text-textOnDark focus:outline-none focus:ring-2 focus:ring-accentGold/50"
                  >
                    <option value="low">Low - Within 24 hours</option>
                    <option value="medium">Medium - Within 1 hour</option>
                    <option value="high">High - Within 15 minutes</option>
                  </select>
                </div>

                <Input
                  label="Budget (ICP)"
                  type="number"
                  value={taskRequest.budget}
                  onChange={(e) => setTaskRequest(prev => ({ ...prev, budget: Number(e.target.value) }))}
                  min={100}
                  max={10000}
                  helperText="Estimated cost range"
                />
              </div>
            </div>
          )}

          {/* Step 4: Review */}
          {currentStep === 3 && (
            <div className="space-y-6">
              <div className="bg-primary/40 rounded border border-accentGold/20 p-4">
                <h4 className="text-accentGold font-medium mb-3">Task Summary</h4>
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="text-textOnDark/60">Goal:</span>
                    <p className="text-textOnDark">{taskRequest.goal}</p>
                  </div>
                  {taskRequest.context && (
                    <div>
                      <span className="text-textOnDark/60">Context:</span>
                      <p className="text-textOnDark">{taskRequest.context}</p>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-textOnDark/60">Tone:</span>
                      <p className="text-textOnDark capitalize">{taskRequest.tone}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Format:</span>
                      <p className="text-textOnDark capitalize">{taskRequest.outputFormat}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Urgency:</span>
                      <p className="text-textOnDark capitalize">{taskRequest.urgency}</p>
                    </div>
                    <div>
                      <span className="text-textOnDark/60">Budget:</span>
                      <p className="text-accentGold font-medium">{taskRequest.budget} ICP</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-green-500/10 border border-green-500/20 rounded p-4">
                <h4 className="text-green-300 font-medium mb-2">✨ AI Agent Match</h4>
                <p className="text-sm text-textOnDark/80">
                  Based on your requirements, we'll select the most suitable AI agent with expertise in your task domain.
                  Estimated completion time: 10-30 minutes.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between mt-8 pt-6 border-t border-accentGold/20">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={currentStep === 0}
          >
            Previous
          </Button>
          
          {currentStep === steps.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={!taskRequest.goal}
              className="min-w-24"
            >
              Submit Task
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              disabled={currentStep === 0 && !taskRequest.goal}
            >
              Next
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}

export default AIWizard