import { useState } from 'react'
import Button from '../components/Button'
import SEOHead from '../components/SEOHead'

const Features = () => {
  const [activeCategory, setActiveCategory] = useState('ai-agents')
  const [activeDemo, setActiveDemo] = useState('agent-creation')

  // Structured data for Features page
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "name": "OHMS Features - Complete AI Platform Documentation",
    "description": "Explore comprehensive OHMS features including AI agent creation, multi-agent coordination, DFINITY LLM integration, and autonomous operations",
    "url": "https://ohms.ai/features",
    "mainEntity": {
      "@type": "SoftwareApplication",
      "name": "OHMS",
      "description": "Complete autonomous AI platform with advanced features",
      "featureList": [
        "AI Agent Creation",
        "Multi-Agent Coordination",
        "DFINITY LLM Integration",
        "Real-time Chat Interface",
        "Autonomous Operations",
        "Internet Computer Protocol"
      ]
    }
  }

  const categories = [
    {
      id: 'ai-agents',
      name: 'AI Agent Creation',
      icon: '🤖',
      description: 'Create intelligent autonomous agents from simple instructions'
    },
    {
      id: 'coordination',
      name: 'Multi-Agent Coordination',
      icon: '🤝',
      description: 'Advanced orchestration for complex multi-agent workflows'
    },
    {
      id: 'llm-integration',
      name: 'DFINITY LLM',
      icon: '🧠',
      description: 'Decentralized large language model integration'
    },
    {
      id: 'chat-interface',
      name: 'Real-time Chat',
      icon: '💬',
      description: 'Interactive chat interface with AI agents'
    },
    {
      id: 'autonomous-ops',
      name: 'Autonomous Operations',
      icon: '⚙️',
      description: 'Self-governing agent operations and management'
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure',
      icon: '🌐',
      description: 'Internet Computer Protocol and blockchain integration'
    }
  ]

  const features = {
    'ai-agents': [
      {
        title: 'Instruction-Based Creation',
        description: 'Transform natural language instructions into fully functional AI agents. Simply describe what you need, and our platform builds it for you.',
        demo: 'agent-creation',
        codeExample: `// Example: Create a coding assistant
const agent = await createAgent({
  instructions: "Create a Python coding assistant that can help with data science projects",
  capabilities: ["code_generation", "debugging", "documentation"],
  model: "llama3.1-8b"
});`,
        benefits: [
          'Natural language to AI conversion',
          'Automatic capability mapping',
          'Model selection optimization',
          'Instant deployment'
        ]
      },
      {
        title: 'Custom Agent Templates',
        description: 'Choose from pre-built templates for common use cases including content creation, data analysis, customer service, and more.',
        demo: 'templates',
        codeExample: `// Use a pre-built template
const contentAgent = await createFromTemplate('content-writer', {
  style: 'professional',
  topics: ['technology', 'business'],
  tone: 'engaging'
});`,
        benefits: [
          'Proven templates',
          'Industry-specific configurations',
          'Quick setup',
          'Best practices included'
        ]
      },
      {
        title: 'Agent Personality & Behavior',
        description: 'Define specific personality traits, communication styles, and behavioral patterns for your AI agents.',
        demo: 'personality',
        codeExample: `// Configure agent personality
const agent = await createAgent({
  personality: {
    tone: 'professional',
    humor_level: 'moderate',
    expertise_areas: ['technology', 'business'],
    response_style: 'concise'
  }
});`,
        benefits: [
          'Consistent branding',
          'Tailored user experience',
          'Domain expertise',
          'Professional communication'
        ]
      }
    ],
    'coordination': [
      {
        title: 'Intelligent Task Routing',
        description: 'Automatically route tasks to the most capable agents based on their skills, availability, and current workload.',
        demo: 'task-routing',
        codeExample: `// Set up multi-agent workflow
const workflow = await createWorkflow({
  agents: [agent1, agent2, agent3],
  routing: 'intelligent',
  coordination: 'collaborative',
  goal: 'Complete project analysis'
});`,
        benefits: [
          'Optimal resource utilization',
          'Load balancing',
          'Skill-based assignment',
          'Real-time adaptation'
        ]
      },
      {
        title: 'Inter-Agent Communication',
        description: 'Enable seamless communication between agents with shared context, knowledge transfer, and collaborative decision-making.',
        demo: 'communication',
        codeExample: `// Enable agent collaboration
await enableCollaboration(agents, {
  shared_context: true,
  knowledge_sharing: true,
  consensus_mechanism: 'democratic',
  communication_protocol: 'structured'
});`,
        benefits: [
          'Knowledge sharing',
          'Collaborative problem-solving',
          'Reduced redundancy',
          'Improved outcomes'
        ]
      },
      {
        title: 'Workflow Orchestration',
        description: 'Design complex multi-step workflows with conditional logic, error handling, and parallel processing capabilities.',
        demo: 'orchestration',
        codeExample: `// Create complex workflow
const workflow = {
  steps: [
    { agent: 'researcher', task: 'gather_data' },
    { agent: 'analyst', task: 'analyze_data', depends_on: 'researcher' },
    { agent: 'writer', task: 'create_report', depends_on: 'analyst' }
  ],
  error_handling: 'retry',
  parallel_execution: true
};`,
        benefits: [
          'Complex task automation',
          'Error resilience',
          'Scalable processing',
          'Process optimization'
        ]
      }
    ],
    'llm-integration': [
      {
        title: 'Advanced AI Access',
        description: 'Direct integration with cutting-edge AI infrastructure for secure, private AI processing.',
        demo: 'dfinity-integration',
        codeExample: `// Use advanced AI directly
const response = await aiService.generate({
  prompt: "Analyze this data",
  model: "llama-3.1-8b",
  privacy_level: "encrypted"
});`,
        benefits: [
          'Decentralized processing',
          'Enhanced privacy',
          'Censorship resistance',
          'Global accessibility'
        ]
      },
      {
        title: 'Model Optimization',
        description: 'Automatic model selection and optimization based on task requirements, performance metrics, and cost efficiency.',
        demo: 'model-optimization',
        codeExample: `// Automatic model selection
const optimizedModel = await selectModel({
  task: 'code_generation',
  complexity: 'high',
  budget: 'cost_optimized',
  performance_target: 'fast'
});`,
        benefits: [
          'Cost optimization',
          'Performance tuning',
          'Automatic scaling',
          'Quality assurance'
        ]
      },
      {
        title: 'Custom Fine-tuning',
        description: 'Fine-tune models for specific domains, industries, or use cases with your own data and requirements.',
        demo: 'fine-tuning',
        codeExample: `// Fine-tune for specific domain
const fineTunedModel = await fineTuneModel({
  base_model: "llama3.1-8b",
  training_data: domainData,
  domain: "medical_diagnosis",
  validation_set: validationData
});`,
        benefits: [
          'Domain expertise',
          'Improved accuracy',
          'Specialized knowledge',
          'Custom capabilities'
        ]
      }
    ],
    'chat-interface': [
      {
        title: 'Multi-Agent Conversations',
        description: 'Engage in conversations with multiple AI agents simultaneously, each bringing their unique expertise to the discussion.',
        demo: 'multi-agent-chat',
        codeExample: `// Start multi-agent conversation
const conversation = await createMultiAgentChat({
  agents: ['analyst', 'researcher', 'strategist'],
  topic: 'Market analysis',
  conversation_style: 'collaborative',
  max_rounds: 10
});`,
        benefits: [
          'Diverse perspectives',
          'Comprehensive analysis',
          'Knowledge synthesis',
          'Creative problem-solving'
        ]
      },
      {
        title: 'Real-time Streaming',
        description: 'Experience real-time streaming responses with live updates, progress indicators, and interactive feedback.',
        demo: 'streaming',
        codeExample: `// Enable real-time streaming
const stream = await chatWithStreaming({
  agent: selectedAgent,
  message: userInput,
  onChunk: (chunk) => {
    displayChunk(chunk);
    updateProgress();
  },
  onComplete: () => finalizeResponse()
});`,
        benefits: [
          'Immediate feedback',
          'Progress visibility',
          'Interactive experience',
          'Reduced latency'
        ]
      },
      {
        title: 'Context Management',
        description: 'Maintain conversation context across sessions with intelligent memory management and knowledge persistence.',
        demo: 'context-management',
        codeExample: `// Manage conversation context
const contextManager = new ContextManager({
  memory_limit: '1000_tokens',
  persistence: 'session',
  compression: 'intelligent',
  retrieval_strategy: 'semantic'
});`,
        benefits: [
          'Continuous conversations',
          'Knowledge retention',
          'Personalization',
          'Efficiency improvement'
        ]
      }
    ],
    'autonomous-ops': [
      {
        title: 'Self-Governing Agents',
        description: 'Deploy agents that operate independently, making decisions and taking actions based on their programmed objectives.',
        demo: 'self-governing',
        codeExample: `// Create autonomous agent
const autonomousAgent = await createAutonomousAgent({
  objectives: ['monitor_system', 'optimize_performance', 'handle_errors'],
  decision_making: 'rule_based',
  autonomy_level: 'high',
  reporting_interval: '1_hour'
});`,
        benefits: [
          '24/7 operation',
          'Independent decision-making',
          'Reduced human intervention',
          'Scalable operations'
        ]
      },
      {
        title: 'Performance Monitoring',
        description: 'Comprehensive monitoring and analytics for agent performance, task completion rates, and system health metrics.',
        demo: 'performance-monitoring',
        codeExample: `// Monitor agent performance
const monitor = await createPerformanceMonitor({
  metrics: ['response_time', 'success_rate', 'resource_usage'],
  alerts: ['performance_drop', 'error_rate'],
  reporting: 'real_time',
  dashboard: 'comprehensive'
});`,
        benefits: [
          'Real-time insights',
          'Performance optimization',
          'Proactive maintenance',
          'Quality assurance'
        ]
      },
      {
        title: 'Error Recovery',
        description: 'Intelligent error detection and recovery mechanisms that ensure system reliability and continuous operation.',
        demo: 'error-recovery',
        codeExample: `// Configure error recovery
const recoverySystem = {
  error_detection: 'real_time',
  recovery_strategies: ['retry', 'fallback', 'reinitialization'],
  escalation_policy: 'intelligent',
  learning_mechanism: 'adaptive'
};`,
        benefits: [
          'System resilience',
          'Automatic recovery',
          'Minimal downtime',
          'Continuous learning'
        ]
      }
    ],
    'infrastructure': [
      {
        title: 'Internet Computer Protocol',
        description: 'Built on the Internet Computer Protocol for true decentralization, infinite scalability, and global accessibility.',
        demo: 'ic-protocol',
        codeExample: `// Deploy to Internet Computer
const deployment = await deployToIC({
  canister_type: 'autonomous_agent',
  replication_factor: 'global',
  resource_allocation: 'dynamic',
  update_strategy: 'hot_swap'
});`,
        benefits: [
          'True decentralization',
          'Global scalability',
          'Censorship resistance',
          'Cost efficiency'
        ]
      },
      {
        title: 'Canister Optimization',
        description: 'Advanced canister optimization techniques for maximum performance, minimal costs, and efficient resource utilization.',
        demo: 'canister-optimization',
        codeExample: `// Optimize canister performance
const optimizedCanister = await optimizeCanister({
  memory_management: 'intelligent',
  computation_cycles: 'efficient',
  storage_strategy: 'compressed',
  query_optimization: 'advanced'
});`,
        benefits: [
          'Cost reduction',
          'Performance improvement',
          'Resource efficiency',
          'Scalability enhancement'
        ]
      },
      {
        title: 'Blockchain Integration',
        description: 'Seamless integration with blockchain technology for secure transactions, verifiable operations, and trustless interactions.',
        demo: 'blockchain-integration',
        codeExample: `// Integrate blockchain features
const blockchainAgent = await createBlockchainAgent({
  wallet_integration: true,
  transaction_monitoring: true,
  smart_contract_interaction: true,
  decentralized_storage: true
});`,
        benefits: [
          'Security enhancement',
          'Trustless operations',
          'Transparent transactions',
          'Decentralized governance'
        ]
      }
    ]
  }

  const demos = {
    'agent-creation': {
      title: 'AI Agent Creation Demo',
      description: 'Watch how natural language instructions are transformed into functional AI agents',
      interactive: true,
      steps: [
        'Enter natural language instructions',
        'AI analyzes and maps capabilities',
        'Selects optimal model configuration',
        'Deploys autonomous agent',
        'Test and refine functionality'
      ]
    },
    'task-routing': {
      title: 'Intelligent Task Routing Demo',
      description: 'See how tasks are automatically routed to the most capable agents',
      interactive: false,
      visualization: 'routing-flowchart'
    },
    'advanced-integration': {
      title: 'Advanced AI Integration Demo',
      description: 'Experience decentralized AI processing with advanced AI',
      interactive: false,
      code: `// Direct AI integration
const response = await aiService.generate(prompt, {
  model: 'advanced-llm',
  privacy: 'encrypted'
})`
    }
  }

  return (
    <>
      <SEOHead
        title="Features - OHMS Autonomous AI Platform"
        description="Explore comprehensive OHMS features including AI agent creation, multi-agent coordination, DFINITY LLM integration, real-time chat, and autonomous operations"
        keywords={['OHMS features', 'AI agents', 'autonomous operations', 'DFINITY LLM', 'multi-agent coordination', 'Internet Computer']}
        canonical="/features"
        ogImage="/ohms-features.png"
        ogType="website"
        structuredData={structuredData}
      />

      <div className="min-h-screen bg-gradient-to-br from-primary via-primary-dark to-primary-darker">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-secondary/10 to-accent/10"></div>
          <div className="relative z-10 container mx-auto px-4 py-20 lg:py-32">
            <div className="text-center max-w-4xl mx-auto">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-secondary via-secondary-light to-accent bg-clip-text text-transparent">
                  Powerful Features
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-text-secondary mb-4">
                Everything you need to build autonomous AI
              </p>
              <p className="text-lg text-text-muted max-w-2xl mx-auto">
                Discover the comprehensive suite of features that make OHMS the most advanced
                autonomous AI platform on the Internet Computer Protocol.
              </p>
            </div>
          </div>
        </section>

        {/* Feature Categories */}
        <section className="py-8">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <div className="bg-surface/30 backdrop-blur-sm rounded-xl p-2 border border-border">
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`px-4 py-3 rounded-lg font-medium transition-all duration-300 flex items-center gap-2 ${
                        activeCategory === category.id
                          ? 'bg-secondary text-white shadow-lg'
                          : 'text-text-secondary hover:bg-secondary/20 hover:text-secondary'
                      }`}
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span className="hidden sm:inline">{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Content */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Feature List */}
              <div className="space-y-6">
                <div className="text-center lg:text-left mb-8">
                  <h2 className="text-3xl font-bold text-text-primary mb-4">
                    {categories.find(cat => cat.id === activeCategory)?.name}
                  </h2>
                  <p className="text-lg text-text-secondary">
                    {categories.find(cat => cat.id === activeCategory)?.description}
                  </p>
                </div>

                {features[activeCategory as keyof typeof features]?.map((feature, index) => (
                  <div key={index} className="bg-surface/50 border border-border rounded-xl p-6 hover:bg-surface/80 transition-all duration-300">
                    <h3 className="text-xl font-bold text-text-primary mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-text-secondary leading-relaxed mb-4">
                      {feature.description}
                    </p>

                    {/* Code Example */}
                    <div className="bg-primary-dark rounded-lg p-4 mb-4">
                      <pre className="text-sm text-accent overflow-x-auto">
                        <code>{feature.codeExample}</code>
                      </pre>
                    </div>

                    {/* Benefits */}
                    <div className="grid grid-cols-2 gap-2">
                      {feature.benefits.map((benefit, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <span className="text-accent-success text-sm">✓</span>
                          <span className="text-sm text-text-secondary">{benefit}</span>
                        </div>
                      ))}
                    </div>

                    {/* Demo Button */}
                    <div className="mt-4">
                      <Button
                        size="sm"
                        onClick={() => setActiveDemo(feature.demo)}
                        className="bg-secondary/20 hover:bg-secondary/30 text-secondary border border-secondary/30"
                      >
                        View Demo
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactive Demo */}
              <div className="relative">
                <div className="sticky top-8">
                  <div className="bg-surface/50 border border-border rounded-xl p-6">
                    <h3 className="text-xl font-bold text-text-primary mb-4">
                      {demos[activeDemo as keyof typeof demos]?.title || 'Interactive Demo'}
                    </h3>
                    <p className="text-text-secondary mb-6">
                      {demos[activeDemo as keyof typeof demos]?.description || 'Select a feature to see the demo'}
                    </p>

                    {/* Demo Content */}
                    <div className="aspect-video bg-gradient-to-br from-primary-dark to-primary-darker rounded-lg flex items-center justify-center border border-border">
                      {activeDemo === 'agent-creation' && demos[activeDemo] ? (
                        <div className="text-center p-6">
                          <div className="text-6xl mb-4">🤖</div>
                          <div className="space-y-3">
                            {demos[activeDemo].steps?.map((step, idx) => (
                              <div key={idx} className="flex items-center gap-3 text-left">
                                <span className="bg-secondary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                                  {idx + 1}
                                </span>
                                <span className="text-text-secondary text-sm">{step}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <div className="text-6xl mb-4">🎬</div>
                          <p className="text-text-secondary">Interactive Demo</p>
                          <p className="text-text-muted text-sm">Coming Soon</p>
                        </div>
                      )}
                    </div>

                    {/* Demo Controls */}
                    <div className="mt-4 flex gap-2">
                      <Button size="sm" className="flex-1">
                        Try It Live
                      </Button>
                      <Button size="sm" variant="outline">
                        View Documentation
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Comparison */}
        <section className="py-20 bg-gradient-to-r from-secondary/5 to-accent/5">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  Feature Comparison
                </h2>
                <p className="text-lg text-text-secondary">
                  See how OHMS compares to traditional AI platforms
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full bg-surface/50 border border-border rounded-xl">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left p-4 font-semibold text-text-primary">Feature</th>
                      <th className="text-center p-4 font-semibold text-text-primary">OHMS</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Traditional AI</th>
                      <th className="text-center p-4 font-semibold text-text-primary">Cloud AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Decentralized</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Autonomous Agents</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Multi-Agent Coordination</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">DFINITY LLM Integration</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Internet Computer Protocol</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">Transparent Pricing</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="p-4 font-medium text-text-primary">No Vendor Lock-in</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                    <tr>
                      <td className="p-4 font-medium text-text-primary">Censorship Resistant</td>
                      <td className="p-4 text-center text-accent-success">✓</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                      <td className="p-4 text-center text-red-400">✗</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        {/* API Documentation */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                  API Documentation
                </h2>
                <p className="text-lg text-text-secondary">
                  Complete API reference for integrating with OHMS platform
                </p>
              </div>

              <div className="space-y-6">
                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-text-primary mb-3">
                    Core API Endpoints
                  </h3>
                  <div className="space-y-4">
                    <div className="bg-primary-dark rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-secondary px-2 py-1 rounded text-xs font-bold">POST</span>
                        <code className="text-accent">/api/agents/create</code>
                      </div>
                      <p className="text-text-secondary text-sm">
                        Create a new AI agent from instructions
                      </p>
                    </div>

                    <div className="bg-primary-dark rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-accent px-2 py-1 rounded text-xs font-bold">GET</span>
                        <code className="text-accent">/api/agents/{'{agent_id}'}</code>
                      </div>
                      <p className="text-text-secondary text-sm">
                        Retrieve agent information and status
                      </p>
                    </div>

                    <div className="bg-primary-dark rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-accent-success px-2 py-1 rounded text-xs font-bold">POST</span>
                        <code className="text-accent">/api/chat/send</code>
                      </div>
                      <p className="text-text-secondary text-sm">
                        Send message to AI agent with streaming response
                      </p>
                    </div>

                    <div className="bg-primary-dark rounded-lg p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="bg-accent-light px-2 py-1 rounded text-xs font-bold">POST</span>
                        <code className="text-accent">/api/workflows/create</code>
                      </div>
                      <p className="text-text-secondary text-sm">
                        Create multi-agent workflow with coordination
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-surface/50 border border-border rounded-xl p-6">
                  <h3 className="text-xl font-bold text-text-primary mb-3">
                    SDK & Libraries
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">JavaScript/TypeScript</h4>
                      <code className="text-sm text-accent">npm install @ohms-ai/sdk</code>
                    </div>
                    <div className="bg-gradient-to-br from-green-500/10 to-green-600/10 border border-green-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">Python</h4>
                      <code className="text-sm text-accent">pip install ohms-ai</code>
                    </div>
                    <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">Rust</h4>
                      <code className="text-sm text-accent">cargo add ohms-ai</code>
                    </div>
                    <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 border border-orange-500/20 rounded-lg p-4">
                      <h4 className="font-semibold text-text-primary mb-2">Go</h4>
                      <code className="text-sm text-accent">go get github.com/ohms-ai/go-sdk</code>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
                Ready to Explore All Features?
              </h2>
              <p className="text-lg text-text-secondary mb-8">
                Start with our free plan and unlock the full potential of autonomous AI.
                No credit card required, no hidden fees.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-secondary-light hover:from-secondary-light hover:to-secondary text-white border-none px-8 py-4 text-lg">
                  🚀 Start Free Trial
                </Button>
                <Button size="lg" variant="outline" className="border-secondary/50 text-secondary hover:bg-secondary/10 px-8 py-4 text-lg">
                  📚 View Full Documentation
                </Button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}

export default Features
